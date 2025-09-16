// Working serverless function using Vercel format
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    try {
        // Test endpoint
        if (pathname === '/api/test') {
            return res.status(200).json({
                message: "API is working",
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || "development"
            });
        }

        // Health check with database
        if (pathname === '/api/health') {
            try {
                const pool = await import("../backend/utils/db.js");
                const [rows] = await pool.default.query("SELECT 1 as test");
                return res.status(200).json({
                    status: "healthy",
                    database: "connected",
                    timestamp: new Date().toISOString(),
                    test: rows[0]
                });
            } catch (error) {
                console.error("Health check error:", error);
                return res.status(500).json({
                    status: "unhealthy",
                    database: "disconnected",
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Auth routes
        if (pathname === '/api/auth/register' && req.method === 'POST') {
            try {
                const { registerUser } = await import("../backend/controllers/authController.js");
                const mockReq = {
                    body: req.body,
                    method: req.method,
                    url: req.url
                };
                const mockRes = {
                    status: (code) => ({
                        json: (data) => res.status(code).json(data)
                    }),
                    json: (data) => res.status(200).json(data)
                };
                await registerUser(mockReq, mockRes);
                return;
            } catch (error) {
                console.error("Register error:", error);
                return res.status(500).json({ message: "Registration failed", error: error.message });
            }
        }

        if (pathname === '/api/auth/login' && req.method === 'POST') {
            try {
                const { loginUser } = await import("../backend/controllers/authController.js");
                const mockReq = {
                    body: req.body,
                    method: req.method,
                    url: req.url
                };
                const mockRes = {
                    status: (code) => ({
                        json: (data) => res.status(code).json(data)
                    }),
                    json: (data) => res.status(200).json(data)
                };
                await loginUser(mockReq, mockRes);
                return;
            } catch (error) {
                console.error("Login error:", error);
                return res.status(500).json({ message: "Login failed", error: error.message });
            }
        }

        // Admin auth routes
        if (pathname === '/api/admin/auth/login' && req.method === 'POST') {
            try {
                const { email, password } = req.body;
                const bcrypt = await import("bcrypt");
                const jwt = await import("jsonwebtoken");
                const pool = await import("../backend/utils/db.js");
                
                const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

                const [rows] = await pool.default.query("SELECT * FROM admins WHERE email = ?", [email]);
                if (rows.length === 0) {
                    return res.status(401).json({ message: "Invalid credentials ❌" });
                }

                const admin = rows[0];
                const isMatch = await bcrypt.default.compare(password, admin.password_hash);
                if (!isMatch) {
                    return res.status(401).json({ message: "Invalid credentials ❌" });
                }

                const token = jwt.default.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: "2h" });

                // Set cookie for serverless
                const cookieOptions = [
                    `adminToken=${token}`,
                    'HttpOnly',
                    'Path=/',
                    `Max-Age=${2 * 60 * 60}`,
                    'SameSite=Lax'
                ];
                if (process.env.NODE_ENV === "production") {
                    cookieOptions.push('Secure');
                }
                res.setHeader('Set-Cookie', cookieOptions.join('; '));

                return res.status(200).json({ 
                    message: "Login successful ✅", 
                    redirect: "/admin/index.html",
                    admin: { id: admin.id, email: admin.email, role: admin.role }
                });
            } catch (error) {
                console.error("Admin login error:", error);
                return res.status(500).json({ message: "Database error ❌", error: error.message });
            }
        }

        if (pathname === '/api/admin/auth/logout' && req.method === 'POST') {
            try {
                // Clear the admin cookie
                const cookieOptions = [
                    'adminToken=',
                    'HttpOnly',
                    'Path=/',
                    'Max-Age=0',
                    'SameSite=Lax'
                ];
                if (process.env.NODE_ENV === "production") {
                    cookieOptions.push('Secure');
                }
                res.setHeader('Set-Cookie', cookieOptions.join('; '));

                return res.status(200).json({ 
                    message: "Logged out ✅", 
                    redirect: "/admin/login.html" 
                });
            } catch (error) {
                console.error("Admin logout error:", error);
                return res.status(500).json({ message: "Logout failed ❌", error: error.message });
            }
        }

        if (pathname === '/api/admin/auth/check' && req.method === 'GET') {
            try {
                const jwt = await import("jsonwebtoken");
                const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
                
                const token = req.headers.cookie?.split(';')
                    .find(c => c.trim().startsWith('adminToken='))
                    ?.split('=')[1];

                if (!token) {
                    return res.status(401).json({ message: "Unauthorized ❌" });
                }

                const decoded = jwt.default.verify(token, JWT_SECRET);
                return res.status(200).json({ 
                    message: "Authorized ✅", 
                    admin: decoded 
                });
            } catch (error) {
                console.error("Admin auth check error:", error);
                return res.status(401).json({ message: "Unauthorized ❌" });
            }
        }

        // Admin middleware check for protected pages
        if (pathname.startsWith('/admin/') && !pathname.includes('/admin/login.html') && !pathname.includes('/admin/assets/')) {
            try {
                const jwt = await import("jsonwebtoken");
                const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
                
                const token = req.headers.cookie?.split(';')
                    .find(c => c.trim().startsWith('adminToken='))
                    ?.split('=')[1];

                if (!token) {
                    return res.status(401).json({ 
                        message: "Unauthorized ❌",
                        redirect: "/admin/login.html"
                    });
                }

                const decoded = jwt.default.verify(token, JWT_SECRET);
                // Token is valid, allow access
                return res.status(200).json({ 
                    message: "Authorized ✅", 
                    admin: decoded 
                });
            } catch (error) {
                return res.status(401).json({ 
                    message: "Unauthorized ❌",
                    redirect: "/admin/login.html"
                });
            }
        }

        // Products routes
        if (pathname.startsWith('/api/admin/products')) {
            try {
                const productRoutes = await import("../backend/routes/productRoutes.js");
                const mockReq = { ...req, body: req.body, method: req.method, url: req.url };
                const mockRes = {
                    status: (code) => ({ json: (data) => res.status(code).json(data) }),
                    json: (data) => res.status(200).json(data)
                };
                await productRoutes.default(mockReq, mockRes);
                return;
            } catch (error) {
                return res.status(500).json({ message: "Product operation failed", error: error.message });
            }
        }

        // Categories routes
        if (pathname.startsWith('/api/admin/categories')) {
            try {
                const categoryRoutes = await import("../backend/routes/categoryRoutes.js");
                const mockReq = { ...req, body: req.body, method: req.method, url: req.url };
                const mockRes = {
                    status: (code) => ({ json: (data) => res.status(code).json(data) }),
                    json: (data) => res.status(200).json(data)
                };
                await categoryRoutes.default(mockReq, mockRes);
                return;
            } catch (error) {
                return res.status(500).json({ message: "Category operation failed", error: error.message });
            }
        }

        // Attributes routes
        if (pathname.startsWith('/api/admin/attributes')) {
            try {
                const attributeRoutes = await import("../backend/routes/attributeRoutes.js");
                const mockReq = { ...req, body: req.body, method: req.method, url: req.url };
                const mockRes = {
                    status: (code) => ({ json: (data) => res.status(code).json(data) }),
                    json: (data) => res.status(200).json(data)
                };
                await attributeRoutes.default(mockReq, mockRes);
                return;
            } catch (error) {
                return res.status(500).json({ message: "Attribute operation failed", error: error.message });
            }
        }

        // Users routes
        if (pathname.startsWith('/api/admin/users')) {
            try {
                const userRoutes = await import("../backend/routes/adminUserRoutes.js");
                const mockReq = { ...req, body: req.body, method: req.method, url: req.url };
                const mockRes = {
                    status: (code) => ({ json: (data) => res.status(code).json(data) }),
                    json: (data) => res.status(200).json(data)
                };
                await userRoutes.default(mockReq, mockRes);
                return;
            } catch (error) {
                return res.status(500).json({ message: "User operation failed", error: error.message });
            }
        }

        // Orders routes
        if (pathname.startsWith('/api/orders')) {
            try {
                const orderRoutes = await import("../backend/routes/orders.js");
                const mockReq = { ...req, body: req.body, method: req.method, url: req.url };
                const mockRes = {
                    status: (code) => ({ json: (data) => res.status(code).json(data) }),
                    json: (data) => res.status(200).json(data)
                };
                await orderRoutes.default(mockReq, mockRes);
                return;
            } catch (error) {
                return res.status(500).json({ message: "Order operation failed", error: error.message });
            }
        }

        // Default response
        return res.status(200).json({
            message: "API function is running",
            path: pathname,
            method: req.method,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Function error:", error);
        return res.status(500).json({
            error: "Internal server error",
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}
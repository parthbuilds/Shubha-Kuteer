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
                const pool = await import("../backend/utils/db.js");
                
                // GET all products
                if (pathname === '/api/admin/products' && req.method === 'GET') {
                    const [rows] = await pool.default.query(`
                        SELECT id, name, slug, price, origin_price, quantity, sold, 
                               rate, is_new, on_sale, category, description, type, brand, 
                               main_image, created_at
                        FROM products
                        ORDER BY created_at DESC
                    `);
                    return res.status(200).json(rows);
                }
                
                // POST new product
                if (pathname === '/api/admin/products' && req.method === 'POST') {
                    const {
                        name, slug, price, origin_price, quantity, sold, quantity_purchase,
                        rate, is_new, on_sale, sizes, variations, category, description,
                        type, brand, main_image, gallery
                    } = req.body;
                    
                    if (!name || !price) {
                        return res.status(400).json({ message: "Name and price are required!" });
                    }
                    
                    const [result] = await pool.default.query(`
                        INSERT INTO products (name, slug, price, origin_price, quantity, sold, 
                                            quantity_purchase, rate, is_new, on_sale, sizes, 
                                            variations, category, description, type, brand, 
                                            main_image, gallery)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        name, slug, price, origin_price, quantity || 0, sold || 0,
                        quantity_purchase || 0, rate || 0, is_new || 0, on_sale || 0,
                        JSON.stringify(sizes || []), JSON.stringify(variations || []),
                        category, description, type, brand, main_image, JSON.stringify(gallery || [])
                    ]);
                    
                    return res.status(200).json({
                        message: "Product added successfully!",
                        data: { id: result.insertId, name, price }
                    });
                }
                
                return res.status(404).json({ message: "Product endpoint not found" });
            } catch (error) {
                console.error("Product operation error:", error);
                return res.status(500).json({ message: "Product operation failed", error: error.message });
            }
        }

        // Categories routes
        if (pathname.startsWith('/api/admin/categories')) {
            try {
                const pool = await import("../backend/utils/db.js");
                
                // Handle different category endpoints
                if (pathname === '/api/admin/categories/public' && req.method === 'GET') {
                    const [rows] = await pool.default.query(`
                        SELECT id, name, data_item, sale, created_at
                        FROM categories
                        ORDER BY created_at DESC
                    `);
                    return res.status(200).json(rows);
                }
                
                if (pathname === '/api/admin/categories' && req.method === 'POST') {
                    const { name, sale, data_item } = req.body;
                    if (!name) {
                        return res.status(400).json({ message: "Category name is required!" });
                    }
                    const finalDataItem = data_item?.trim() || name.toLowerCase().replace(/\s+/g, "");
                    const [result] = await pool.default.query(
                        "INSERT INTO categories (name, data_item, sale) VALUES (?, ?, ?)",
                        [name, finalDataItem, sale || 0]
                    );
                    return res.status(200).json({
                        message: "Category added successfully!",
                        data: { id: result.insertId, name, data_item: finalDataItem, sale: sale || 0 }
                    });
                }
                
                if (pathname.startsWith('/api/admin/categories/') && req.method === 'DELETE') {
                    const id = pathname.split('/').pop();
                    await pool.default.query("DELETE FROM categories WHERE id = ?", [id]);
                    return res.status(200).json({ message: "Category deleted successfully!" });
                }
                
                return res.status(404).json({ message: "Category endpoint not found" });
            } catch (error) {
                console.error("Category operation error:", error);
                return res.status(500).json({ message: "Category operation failed", error: error.message });
            }
        }

        // Attributes routes
        if (pathname.startsWith('/api/admin/attributes')) {
            try {
                const pool = await import("../backend/utils/db.js");
                
                // GET all attributes
                if (pathname === '/api/admin/attributes' && req.method === 'GET') {
                    const [rows] = await pool.default.query(`
                        SELECT a.id, a.category_id, a.attribute_name, a.attribute_value, 
                               a.attribute_hash, a.created_at, c.name as category_name
                        FROM attributes a
                        LEFT JOIN categories c ON a.category_id = c.id
                        ORDER BY a.created_at DESC
                    `);
                    return res.status(200).json(rows);
                }
                
                // POST new attribute
                if (pathname === '/api/admin/attributes' && req.method === 'POST') {
                    const { category_id, attribute_name, attribute_value, attribute_hash } = req.body;
                    
                    if (!category_id || !attribute_name || !attribute_value) {
                        return res.status(400).json({
                            message: "Missing required fields: category_id, attribute_name, attribute_value"
                        });
                    }
                    
                    const [result] = await pool.default.query(`
                        INSERT INTO attributes (category_id, attribute_name, attribute_value, attribute_hash) 
                        VALUES (?, ?, ?, ?)
                    `, [category_id, attribute_name, attribute_value, attribute_hash || null]);
                    
                    return res.status(200).json({
                        message: "Attribute added successfully!",
                        data: { id: result.insertId, category_id, attribute_name, attribute_value }
                    });
                }
                
                // DELETE attribute
                if (pathname.startsWith('/api/admin/attributes/') && req.method === 'DELETE') {
                    const id = pathname.split('/').pop();
                    await pool.default.query("DELETE FROM attributes WHERE id = ?", [id]);
                    return res.status(200).json({ message: "Attribute deleted successfully!" });
                }
                
                return res.status(404).json({ message: "Attribute endpoint not found" });
            } catch (error) {
                console.error("Attribute operation error:", error);
                return res.status(500).json({ message: "Attribute operation failed", error: error.message });
            }
        }

        // Users routes
        if (pathname.startsWith('/api/admin/users')) {
            try {
                const pool = await import("../backend/utils/db.js");
                const bcrypt = await import("bcrypt");
                
                // GET all users
                if (pathname === '/api/admin/users' && req.method === 'GET') {
                    const [rows] = await pool.default.query(`
                        SELECT id, name, email, created_at
                        FROM users
                        ORDER BY created_at DESC
                    `);
                    return res.status(200).json(rows);
                }
                
                // POST new user (admin creating user)
                if (pathname === '/api/admin/users' && req.method === 'POST') {
                    const { name, email, password } = req.body;
                    
                    if (!name || !email || !password) {
                        return res.status(400).json({
                            message: "Name, email, and password are required!"
                        });
                    }
                    
                    // Check if user already exists
                    const [existing] = await pool.default.query(
                        "SELECT id FROM users WHERE email = ?", [email]
                    );
                    
                    if (existing.length > 0) {
                        return res.status(409).json({ message: "User with this email already exists!" });
                    }
                    
                    // Hash password
                    const password_hash = await bcrypt.default.hash(password, 10);
                    
                    const [result] = await pool.default.query(`
                        INSERT INTO users (name, email, password_hash) 
                        VALUES (?, ?, ?)
                    `, [name, email, password_hash]);
                    
                    return res.status(200).json({
                        message: "User created successfully!",
                        data: { id: result.insertId, name, email }
                    });
                }
                
                // PUT update user
                if (pathname.startsWith('/api/admin/users/') && req.method === 'PUT') {
                    const id = pathname.split('/').pop();
                    const { name, email, phone } = req.body;
                    
                    if (!name || !email) {
                        return res.status(400).json({
                            message: "Name and email are required!"
                        });
                    }
                    
                    // Check if email already exists for another user
                    const [existing] = await pool.default.query(
                        "SELECT id FROM users WHERE email = ? AND id != ?", [email, id]
                    );
                    
                    if (existing.length > 0) {
                        return res.status(409).json({ message: "Email already exists for another user!" });
                    }
                    
                    const [result] = await pool.default.query(`
                        UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?
                    `, [name, email, phone || null, id]);
                    
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "User not found!" });
                    }
                    
                    return res.status(200).json({
                        message: "User updated successfully!",
                        data: { id, name, email, phone }
                    });
                }
                
                // DELETE user
                if (pathname.startsWith('/api/admin/users/') && req.method === 'DELETE') {
                    const id = pathname.split('/').pop();
                    const [result] = await pool.default.query("DELETE FROM users WHERE id = ?", [id]);
                    
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "User not found!" });
                    }
                    
                    return res.status(200).json({ message: "User deleted successfully!" });
                }
                
                return res.status(404).json({ message: "User endpoint not found" });
            } catch (error) {
                console.error("User operation error:", error);
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
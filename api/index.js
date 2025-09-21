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
                            main_image, thumb_image, gallery, action, created_at
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
                        type, brand, main_image, gallery, action
                    } = req.body;

                    if (!name || !price) {
                        return res.status(400).json({ message: "Name and price are required!" });
                    }

                    // Set thumb_image to same as main_image (as requested)
                    const thumb_image = main_image || "";

                    const [result] = await pool.default.query(`
                        INSERT INTO products (name, slug, price, origin_price, quantity, sold, 
                                            quantity_purchase, rate, is_new, on_sale, sizes, 
                                            variations, category, description, type, brand, 
                                            main_image, thumb_image, gallery, action)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        name, slug, price, origin_price, quantity || 0, sold || 0,
                        quantity_purchase || 0, rate || 0, is_new || 0, on_sale || 0,
                        JSON.stringify(sizes || []), JSON.stringify(variations || []),
                        category, description, type, brand,
                        main_image, thumb_image, JSON.stringify(gallery || []),
                        action || "add to cart"
                    ]);

                    return res.status(200).json({
                        message: "Product added successfully!",
                        data: {
                            id: result.insertId,
                            name,
                            price,
                            main_image,
                            thumb_image,
                            action: action || "add to cart"
                        }
                    });
                }

                // DELETE product
                if (pathname.startsWith('/api/admin/products/') && req.method === 'DELETE') {
                    const id = pathname.split('/').pop();
                    await pool.default.query("DELETE FROM products WHERE id = ?", [id]);
                    return res.status(200).json({ message: "Product deleted successfully!" });
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

        // --- ATTRIBUTES ROUTES - REWRITTEN ---
        if (pathname.startsWith('/api/admin/attributes')) {
            try {
                const pool = await import("../backend/utils/db.js");

                // GET all attributes
                if (pathname === '/api/admin/attributes' && req.method === 'GET') {
                    const [rows] = await pool.default.query(`
                        SELECT a.id, a.attribute_name, a.attribute_values, a.created_at,
                               c.name AS category_name
                        FROM attributes a
                        LEFT JOIN categories c ON a.category_id = c.id
                        ORDER BY a.created_at DESC
                    `);
                    return res.status(200).json(rows);
                }

                // POST new attribute
                if (pathname === '/api/admin/attributes' && req.method === 'POST') {
                    const { category_id, attribute_name, attribute_values } = req.body;
            
                    // Validate that all required fields are present
                    if (!category_id || !attribute_name || !attribute_values) {
                        return res.status(400).json({
                            error: "Missing required fields: category_id, attribute_name, and attribute_values",
                        });
                    }
            
                    // Validate that attribute_values is a non-empty array
                    if (!Array.isArray(attribute_values) || attribute_values.length === 0) {
                        return res.status(400).json({
                            error: "attribute_values must be a non-empty array of objects.",
                        });
                    }
            
                    const [result] = await pool.default.query(
                        `INSERT INTO attributes (category_id, attribute_name, attribute_values) 
                        VALUES (?, ?, ?)`,
                        [category_id, attribute_name, JSON.stringify(attribute_values)]
                    );
            
                    return res.status(201).json({
                        success: true,
                        id: result.insertId,
                        message: "Attribute added successfully",
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
        // --- END OF ATTRIBUTES ROUTES REWRITTEN ---


        // Admin Users routes (for managing admins)
        if (pathname.startsWith('/api/admin/users')) {
            try {
                const pool = await import("../backend/utils/db.js");
                const bcrypt = await import("bcrypt");
                const jwt = await import("jsonwebtoken");
                const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

                // GET all admins
                if (pathname === '/api/admin/users' && req.method === 'GET') {
                    const [rows] = await pool.default.query(`
                SELECT id, name, email, phone, role, permissions, created_at
                FROM admins
                ORDER BY created_at DESC
            `);
                    return res.status(200).json(rows);
                }

                // GET current logged-in admin (from cookie/token)
                if (pathname === '/api/admin/users/me' && req.method === 'GET') {
                    try {
                        // Extract token from cookie
                        const token = req.headers.cookie?.split(';')
                            .find(c => c.trim().startsWith('adminToken='))
                            ?.split('=')[1];

                        if (!token) {
                            return res.status(401).json({ message: "Unauthorized ❌ (no token)" });
                        }

                        // Verify token
                        const decoded = jwt.default.verify(token, JWT_SECRET);

                        // Fetch admin from DB
                        const [rows] = await pool.default.query(
                            "SELECT id, name, email, role, phone, permissions FROM admins WHERE id = ? LIMIT 1",
                            [decoded.id]
                        );

                        if (rows.length === 0) {
                            return res.status(404).json({ message: "Admin not found ❌" });
                        }

                        return res.status(200).json({
                            success: true,
                            admin: rows[0]
                        });
                    } catch (err) {
                        console.error("Error in /api/admin/users/me:", err);
                        return res.status(500).json({ message: "Failed to fetch admin ❌", error: err.message });
                    }
                }

                // POST new admin
                if (pathname === '/api/admin/users' && req.method === 'POST') {
                    const { name, email, password, phone, role, permissions } = req.body;

                    if (!name || !email || !password) {
                        return res.status(400).json({
                            message: "Name, email, and password are required!"
                        });
                    }

                    // Check if admin already exists
                    const [existing] = await pool.default.query(
                        "SELECT id FROM admins WHERE email = ?", [email]
                    );

                    if (existing.length > 0) {
                        return res.status(409).json({ message: "Admin with this email already exists!" });
                    }

                    // Hash password
                    const password_hash = await bcrypt.default.hash(password, 10);

                    const [result] = await pool.default.query(`
                INSERT INTO admins (name, email, password_hash, phone, role, permissions) 
                VALUES (?, ?, ?, ?, ?, ?)
            `, [name, email, password_hash, phone || null, role || 'admin', JSON.stringify(permissions || {})]);

                    return res.status(200).json({
                        message: "Admin created successfully!",
                        data: { id: result.insertId, name, email, role: role || 'admin' }
                    });
                }

                // PUT update admin
                if (pathname.startsWith('/api/admin/users/') && req.method === 'PUT') {
                    const id = pathname.split('/').pop();
                    const { name, email, phone } = req.body;

                    if (!name || !email) {
                        return res.status(400).json({
                            message: "Name and email are required!"
                        });
                    }

                    // Check if email already exists for another admin
                    const [existing] = await pool.default.query(
                        "SELECT id FROM admins WHERE email = ? AND id != ?", [email, id]
                    );

                    if (existing.length > 0) {
                        return res.status(409).json({ message: "Email already exists for another admin!" });
                    }

                    const [result] = await pool.default.query(`
                UPDATE admins SET name = ?, email = ?, phone = ? WHERE id = ?
            `, [name, email, phone || null, id]);

                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Admin not found!" });
                    }

                    return res.status(200).json({
                        message: "Admin updated successfully!",
                        data: { id, name, email, phone }
                    });
                }

                // DELETE admin
                if (pathname.startsWith('/api/admin/users/') && req.method === 'DELETE') {
                    const id = pathname.split('/').pop();
                    const [result] = await pool.default.query("DELETE FROM admins WHERE id = ?", [id]);

                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: "Admin not found!" });
                    }

                    return res.status(200).json({ message: "Admin deleted successfully!" });
                }

                return res.status(404).json({ message: "Admin endpoint not found" });
            } catch (error) {
                console.error("Admin operation error:", error);
                return res.status(500).json({ message: "Admin operation failed", error: error.message });
            }
        }

        // Orders routes
        if (pathname.startsWith('/api/orders')) {
            try {
                const pool = await import("../backend/utils/db.js");

                // Check if Razorpay credentials are available
                if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
                    console.error("Razorpay credentials not found in environment variables");
                    return res.status(500).json({
                        success: false,
                        error: "Payment gateway configuration error"
                    });
                }

                const Razorpay = await import("razorpay");

                // Initialize Razorpay
                const razorpay = new Razorpay.default({
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET,
                });

                // POST /api/orders/create-order
                if (pathname === '/api/orders/create-order' && req.method === 'POST') {
                    const { 
                        first_name, last_name, email, phone_number, 
                        city, apartment, postal_code, note, amount, products 
                    } = req.body;

                    if (!amount || !first_name || !email) {
                        return res.status(400).json({
                            success: false,
                            error: 'Missing required fields: amount, first_name, email'
                        });
                    }

                    try {
                        // Create Razorpay order
                        const razorpayOrder = await razorpay.orders.create({
                            amount: amount * 100, // Convert to paise
                            currency: "INR",
                            receipt: `order_${Date.now()}`,
                        });

                        console.log("Razorpay order created:", razorpayOrder.id);

                        // Save order to database with products JSON
                        const [result] = await pool.default.query(`
                            INSERT INTO orders (first_name, last_name, email, phone_number, 
                                city, apartment, postal_code, note, amount, 
                                razorpay_order_id, status, products, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                        `, [
                            first_name, last_name, email, phone_number,
                            city, apartment, postal_code, note, amount,
                            razorpayOrder.id, 'pending', JSON.stringify(products)
                        ]);

                        console.log("Order saved to database with ID:", result.insertId);
                        console.log("Products saved:", products);

                        return res.status(200).json({
                            success: true,
                            key: process.env.RAZORPAY_KEY_ID,
                            razorpay_order: razorpayOrder,
                            order_id: result.insertId
                        });
                    } catch (error) {
                        console.error("Razorpay error details:", error);
                        return res.status(500).json({
                            success: false,
                            error: `Payment gateway error: ${error.message || 'Unknown error'}`
                        });
                    }
                }

                // POST /api/orders/capture-order
                if (pathname === '/api/orders/capture-order' && req.method === 'POST') {
                    const { razorpay_order_id, razorpay_payment_id, payment_status, order_id } = req.body;

                    try {
                        // Update order status in database
                        await pool.default.query(`
                            UPDATE orders 
                            SET razorpay_payment_id = ?, status = ?, updated_at = NOW()
                            WHERE razorpay_order_id = ?
                        `, [razorpay_payment_id, payment_status, razorpay_order_id]);

                        console.log(`Order ${order_id} payment captured successfully`);

                        return res.status(200).json({
                            success: true,
                            message: 'Payment captured successfully',
                            order_id: order_id
                        });
                    } catch (error) {
                        console.error("Payment capture error:", error);
                        return res.status(500).json({
                            success: false,
                            error: 'Failed to capture payment'
                        });
                    }
                }

                // GET /api/orders - Get all orders with product details
                if (pathname === '/api/orders' && req.method === 'GET') {
                    try {
                        const [orders] = await pool.default.query(`
                            SELECT 
                                id, first_name, last_name, email, phone_number,
                                city, apartment, postal_code, note, amount,
                                razorpay_order_id, razorpay_payment_id, status,
                                products, created_at, updated_at
                            FROM orders 
                            ORDER BY created_at DESC
                        `);

                        // Parse products JSON for each order
                        const ordersWithProducts = orders.map(order => ({
                            ...order,
                            products: order.products ? JSON.parse(order.products) : []
                        }));

                        return res.status(200).json({
                            success: true,
                            orders: ordersWithProducts
                        });
                    } catch (error) {
                        console.error("Get orders error:", error);
                        return res.status(500).json({
                            success: false,
                            error: 'Failed to fetch orders'
                        });
                    }
                }

                // GET /api/orders/:id - Get specific order details
                if (pathname.startsWith('/api/orders/') && req.method === 'GET') {
                    const orderId = pathname.split('/')[3];
                    
                    try {
                        const [orders] = await pool.default.query(`
                            SELECT 
                                id, first_name, last_name, email, phone_number,
                                city, apartment, postal_code, note, amount,
                                razorpay_order_id, razorpay_payment_id, status,
                                products, created_at, updated_at
                            FROM orders 
                            WHERE id = ?
                        `, [orderId]);

                        if (orders.length === 0) {
                            return res.status(404).json({
                                success: false,
                                error: 'Order not found'
                            });
                        }

                        const order = orders[0];
                        order.products = order.products ? JSON.parse(order.products) : [];

                        return res.status(200).json({
                            success: true,
                            order: order
                        });
                    } catch (error) {
                        console.error("Get order error:", error);
                        return res.status(500).json({
                            success: false,
                            error: 'Failed to fetch order'
                        });
                    }
                }

                // DELETE /api/orders/:id - Delete order
                if (pathname.startsWith('/api/orders/') && req.method === 'DELETE') {
                    const orderId = pathname.split('/')[3];
                    
                    try {
                        const [result] = await pool.default.query(`
                            DELETE FROM orders WHERE id = ?
                        `, [orderId]);

                        if (result.affectedRows === 0) {
                            return res.status(404).json({
                                success: false,
                                error: 'Order not found'
                            });
                        }

                        return res.status(200).json({
                            success: true,
                            message: 'Order deleted successfully'
                        });
                    } catch (error) {
                        console.error("Delete order error:", error);
                        return res.status(500).json({
                            success: false,
                            error: 'Failed to delete order'
                        });
                    }
                }

                // GET /api/orders/test - Test endpoint
                if (pathname === '/api/orders/test' && req.method === 'GET') {
                    return res.status(200).json({
                        success: true,
                        message: "Orders API is working",
                        hasRazorpayKey: !!process.env.RAZORPAY_KEY_ID,
                        hasRazorpaySecret: !!process.env.RAZORPAY_KEY_SECRET,
                        timestamp: new Date().toISOString()
                    });
                }

                return res.status(404).json({ message: "Order endpoint not found" });
            } catch (error) {
                console.error("Order operation error:", error);
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

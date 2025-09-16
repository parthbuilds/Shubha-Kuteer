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
                // Create a mock req/res object for the controller
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
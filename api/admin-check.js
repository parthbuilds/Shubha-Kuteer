// Admin authentication check for frontend
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

    try {
        const jwt = await import("jsonwebtoken");
        const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
        
        const token = req.headers.cookie?.split(';')
            .find(c => c.trim().startsWith('adminToken='))
            ?.split('=')[1];

        if (!token) {
            return res.status(401).json({ 
                message: "Unauthorized ❌",
                authenticated: false 
            });
        }

        const decoded = jwt.default.verify(token, JWT_SECRET);
        return res.status(200).json({ 
            message: "Authorized ✅", 
            authenticated: true,
            admin: decoded 
        });
    } catch (error) {
        console.error("Admin auth check error:", error);
        return res.status(401).json({ 
            message: "Unauthorized ❌",
            authenticated: false 
        });
    }
}

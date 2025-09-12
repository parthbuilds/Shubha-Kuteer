const jwt = require("jsonwebtoken");
const path = require("path");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

module.exports = function adminAuth(req, res, next) {
    // Always allow login page and auth API
    if (req.path.endsWith("login.html") || req.path.startsWith("/api/admin/auth")) {
        return next();
    }

    const token = req.cookies?.adminToken;
    if (!token) {
        console.log("No token, redirecting to login");
        return res.redirect("/admin/login.html");
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        console.log("Token valid for:", decoded.email);
        next();
    } catch (err) {
        console.log("Invalid token, redirecting to login");
        return res.redirect("/admin/login.html");
    }
};

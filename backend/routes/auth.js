const { registerUser, loginUser } = require("../controllers/authController");

export default async function handler(req, res) {
    if (req.method === "POST" && req.url.endsWith("/register")) {
        return registerUser(req, res);
    } else if (req.method === "POST" && req.url.endsWith("/login")) {
        return loginUser(req, res);
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
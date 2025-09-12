const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../utils/db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { email, password } = req.body;

        try {
            const [rows] = await pool.query("SELECT * FROM admins WHERE email = ?", [email]);
            if (rows.length === 0)
                return res.status(401).json({ message: "Invalid credentials ❌" });

            const admin = rows[0];
            const isMatch = await bcrypt.compare(password, admin.password_hash);
            if (!isMatch)
                return res.status(401).json({ message: "Invalid credentials ❌" });

            const token = jwt.sign(
                { id: admin.id, email: admin.email, role: admin.role },
                JWT_SECRET,
                { expiresIn: "2h" }
            );

            // Set HTTP-only cookie manually
            res.setHeader("Set-Cookie", `adminToken=${token}; HttpOnly; Path=/; Max-Age=${2 * 60 * 60}; SameSite=Lax`);

            console.log(`Login successful for ${email}, cookie set: ${token}`);

            res.json({ message: "Login successful ✅", redirect: "/admin/index.html" });

        } catch (err) {
            console.error("Login error:", err);
            res.status(500).json({ message: "Database error ❌" });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
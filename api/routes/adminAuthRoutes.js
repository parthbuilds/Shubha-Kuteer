const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../utils/db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

router.post("/login", async (req, res) => {
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

        // ✅ Set HTTP-only cookie
        res.cookie("adminToken", token, {
            httpOnly: true,
            maxAge: 2 * 60 * 60 * 1000, // 2 hours
            sameSite: "lax",
        });

        console.log(`Login successful for ${email}, cookie set: ${token}`);

        // ✅ Send JSON for frontend to handle redirect
        res.json({ message: "Login successful ✅", redirect: "/admin/index.html" });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Database error ❌" });
    }
});

module.exports = router;

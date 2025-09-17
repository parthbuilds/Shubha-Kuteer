import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../utils/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const router = express.Router();

// Admin Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows] = await pool.query("SELECT * FROM admins WHERE email = ?", [email]);
        if (rows.length === 0) return res.status(401).json({ message: "Invalid credentials ❌" });

        const admin = rows[0];
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials ❌" });

        const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: "2h" });

        // ✅ Path set to "/" so it's accessible on all pages
        res.cookie("adminToken", token, {
            httpOnly: true,
            path: "/",
            maxAge: 2 * 60 * 60 * 1000,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production"
        });

        res.json({ message: "Login successful ✅", redirect: "/admin/index.html" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Database error ❌" });
    }
});

// Admin Logout
router.post("/logout", (req, res) => {
    res.cookie("adminToken", "", { httpOnly: true, path: "/admin", maxAge: 0, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
    res.json({ message: "Logged out ✅", redirect: "/admin/login.html" });
});

// Auth check for frontend
router.get("/check", (req, res) => {
    const token = req.cookies?.adminToken;
    if (!token) return res.status(401).json({ message: "Unauthorized ❌" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ message: "Authorized ✅", admin: decoded });
    } catch {
        res.status(401).json({ message: "Unauthorized ❌" });
    }
});

// GET /admin/me → return logged in admin details
router.get("/me/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query(
            "SELECT id, name, role FROM admins WHERE id = ?",
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: "Admin not found ❌" });
        }
        res.json(rows[0]); // return { id, name, role }
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ message: "Database error ❌" });
    }
});

export default router;

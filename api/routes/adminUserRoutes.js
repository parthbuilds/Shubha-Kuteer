const bcrypt = require("bcrypt");
const pool = require("../utils/db");
const url = require("url");

export default async function handler(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    // /api/adminUserRoutes or /api/adminUserRoutes/:id
    const id = pathParts.length > 1 ? pathParts[1] : null;

    if (req.method === "POST" && !id) {
        // Add new admin
        const { name, email, password, role, permissions, phone } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        try {
            const [rows] = await pool.query("SELECT * FROM admins WHERE email = ?", [email]);
            if (rows.length > 0) {
                return res.status(400).json({ message: "Admin already exists" });
            }
            const passwordHash = await bcrypt.hash(password, 10);
            await pool.query(
                "INSERT INTO admins (name, email, password_hash, role, permissions, phone) VALUES (?, ?, ?, ?, ?, ?)",
                [name || null, email, passwordHash, role || "admin", JSON.stringify(permissions) || "[]", phone || null]
            );
            res.json({ message: "Admin added successfully ✅" });
        } catch (err) {
            console.error("DB error:", err);
            res.status(500).json({ message: "Database error ❌" });
        }
    } else if (req.method === "GET" && !id) {
        // List all admins
        try {
            const [rows] = await pool.query(
                "SELECT id, name, email, role, permissions, created_at, phone FROM admins"
            );
            res.json(rows);
        } catch (err) {
            console.error("DB error:", err);
            res.status(500).json({ message: "Database error ❌" });
        }
    } else if (req.method === "GET" && id) {
        // Get single admin
        try {
            const [rows] = await pool.query(
                "SELECT id, name, email, role, permissions, created_at, phone FROM admins WHERE id = ?",
                [id]
            );
            if (rows.length === 0) return res.status(404).json({ message: "Admin not found ❌" });
            res.json(rows[0]);
        } catch (err) {
            console.error("DB error:", err);
            res.status(500).json({ message: "Database error ❌" });
        }
    } else if (req.method === "PUT" && id) {
        // Update admin
        const { name, email, role, permissions, phone } = req.body;
        try {
            await pool.query(
                "UPDATE admins SET name = ?, email = ?, role = ?, permissions = ?, phone = ? WHERE id = ?",
                [name || null, email, role || "admin", JSON.stringify(permissions) || "[]", phone || null, id]
            );
            res.json({ message: "Admin updated successfully ✅" });
        } catch (err) {
            console.error("DB error:", err);
            res.status(500).json({ message: "Database error ❌" });
        }
    } else if (req.method === "DELETE" && id) {
        // Delete admin + user
        try {
            await pool.query("DELETE FROM admins WHERE id = ?", [id]);
            await pool.query("DELETE FROM users WHERE id = ?", [id]);
            res.json({ message: "Admin and linked user deleted successfully ✅" });
        } catch (err) {
            console.error("DB error:", err);
            res.status(500).json({ message: "Database error ❌" });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
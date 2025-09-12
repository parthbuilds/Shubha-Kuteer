const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../utils/db");
const router = express.Router();

// ==========================
// 🔹 Add new admin
// POST /api/admin/users
// ==========================
router.post("/", async (req, res) => {
    // Include phone in the deconstructed request body
    const { name, email, password, role, permissions, phone } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        // Check if admin already exists
        const [rows] = await pool.query("SELECT * FROM admins WHERE email = ?", [email]);
        if (rows.length > 0) {
            return res.status(400).json({ message: "Admin already exists" });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new admin, including the phone number
        await pool.query(
            "INSERT INTO admins (name, email, password_hash, role, permissions, phone) VALUES (?, ?, ?, ?, ?, ?)",
            [name || null, email, passwordHash, role || "admin", JSON.stringify(permissions) || "[]", phone || null]
        );

        res.json({ message: "Admin added successfully ✅" });
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ message: "Database error ❌" });
    }
});

// ==========================
// 🔹 List all admins
// GET /api/admin/users
// ==========================
router.get("/", async (req, res) => {
    try {
        // Select the phone column
        const [rows] = await pool.query(
            "SELECT id, name, email, role, permissions, created_at, phone FROM admins"
        );
        res.json(rows);
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ message: "Database error ❌" });
    }
});

// ==========================
// 🔹 Get single admin
// GET /api/admin/users/:id
// ==========================
router.get("/:id", async (req, res) => {
    const id = req.params.id;
    try {
        // Select the phone column
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
});

// ==========================
// 🔹 Update admin
// PUT /api/admin/users/:id
// ==========================
router.put("/:id", async (req, res) => {
    const id = req.params.id;
    // Include phone in the deconstructed request body
    const { name, email, role, permissions, phone } = req.body;

    try {
        // Update the phone column
        await pool.query(
            "UPDATE admins SET name = ?, email = ?, role = ?, permissions = ?, phone = ? WHERE id = ?",
            [name || null, email, role || "admin", JSON.stringify(permissions) || "[]", phone || null, id]
        );
        res.json({ message: "Admin updated successfully ✅" });
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ message: "Database error ❌" });
    }
});

// ==========================
// 🔹 Delete admin + user
// DELETE /api/admin/users/:id
// ==========================
router.delete("/:id", async (req, res) => {
    const id = req.params.id;

    try {
        // Delete from admins table
        await pool.query("DELETE FROM admins WHERE id = ?", [id]);

        // Also delete from users table (if exists)
        await pool.query("DELETE FROM users WHERE id = ?", [id]);

        res.json({ message: "Admin and linked user deleted successfully ✅" });
    } catch (err) {
        console.error("DB error:", err);
        res.status(500).json({ message: "Database error ❌" });
    }
});

module.exports = router;
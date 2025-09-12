// backend/routes/routes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../utils/db"); // Your MySQL connection pool

const BCRYPT_SALT_ROUNDS = 10;

// --- Registration Route ---
router.post("/auth/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Check if email already exists
        const [existingMember] = await pool.query(
            "SELECT * FROM registered_members WHERE email = ?",
            [email]
        );

        if (existingMember.length > 0) {
            return res.status(409).json({ message: "Email already registered" });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

        // Insert new user
        await pool.query(
            "INSERT INTO registered_members (name, email, password_hash) VALUES (?, ?, ?)",
            [name, email, password_hash]
        );

        res.status(201).json({ message: "Registration successful! 🎉" });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ message: "An error occurred during registration." });
    }
});

// --- Login Route ---
router.post("/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // Find user
        const [rows] = await pool.query(
            "SELECT * FROM registered_members WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const member = rows[0];

        // Compare passwords
        const isMatch = await bcrypt.compare(password, member.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        res.status(200).json({ message: "Login successful! Welcome back." });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "An error occurred during login." });
    }
});

module.exports = router;

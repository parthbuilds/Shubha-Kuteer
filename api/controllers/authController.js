const pool = require("../utils/db"); // Use your MySQL pool
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ==========================
// 🔹 Register user
// POST /api/auth/register
// ==========================
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        // Check if user already exists
        const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into DB
        await pool.query(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: "User registered successfully ✅" });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Database error ❌" });
    }
};

// ==========================
// 🔹 Login user
// POST /api/auth/login
// ==========================
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
    }

    try {
        // Find user
        const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = rows[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({
            message: "Login successful ✅",
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Database error ❌" });
    }
};

// ==========================
// 🔹 Middleware to protect routes
// ==========================
const authenticate = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
};

module.exports = { registerUser, loginUser, authenticate };

// import bcrypt from "bcrypt";
// import pool from "../utils/db.js";
// import jwt from "jsonwebtoken";

// const BCRYPT_SALT_ROUNDS = 10;
// const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// export const registerUser = async (req, res) => {
//     const { name, email, password } = req.body;
//     if (!name || !email || !password) {
//         return res.status(400).json({ message: "All fields are required" });
//     }
//     try {
//         const [existingUser] = await pool.query(
//             "SELECT * FROM users WHERE email = ?",
//             [email]
//         );
//         if (existingUser.length > 0) {
//             return res.status(409).json({ message: "Email already registered" });
//         }
//         const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
//         await pool.query(
//             "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
//             [name, email, password_hash]
//         );
//         res.status(201).json({ message: "Registration successful! 🎉" });
//     } catch (error) {
//         console.error("Error during registration:", error);
//         res.status(500).json({ message: "An error occurred during registration." });
//     }
// };

// export const loginUser = async (req, res) => {
//     const { email, password } = req.body;
//     if (!email || !password) {
//         return res.status(400).json({ message: "Email and password are required" });
//     }
//     try {
//         const [rows] = await pool.query(
//             "SELECT * FROM users WHERE email = ?",
//             [email]
//         );
//         if (rows.length === 0) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }
//         const user = rows[0];
//         const isMatch = await bcrypt.compare(password, user.password_hash);
//         if (!isMatch) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }
//         const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
//         res.status(200).json({ message: "Login successful! Welcome back.", token });
//     } catch (error) {
//         console.error("Error during login:", error);
//         res.status(500).json({ message: "An error occurred during login." });
//     }
// };


import bcrypt from "bcrypt";
import pool from "../utils/db.js";
import jwt from "jsonwebtoken";

const BCRYPT_SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const registerUser = async (req, res) => {
    const { name, email, password, phone_number, dob } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required ❌" });
    }
    try {
        const [existingUser] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        if (existingUser.length > 0) {
            return res.status(409).json({ message: "Email already registered ❌" });
        }
        const password_hash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        await pool.query(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            [name, email, password_hash]
        );
        return res.status(201).json({ message: "Registration successful! 🎉" });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Registration failed ❌", error: error.message });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required ❌" });
    }
    try {
        const [rows] = await pool.query(
            "SELECT id, name, email FROM users WHERE email = ?",
            [email]
        );
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials ❌" });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials ❌" });
        }
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "1h" });
        const [firstName, lastName] = user.name ? user.name.split(' ') : ['', ''];
        return res.status(200).json({
            message: "Login successful! Welcome back. ✅",
            token,
            user: {
                id: user.id,
                first_name: firstName,
                last_name: lastName || '',
                email: user.email,
                phone_number: '',
                dob: ''
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Login failed ❌", error: error.message });
    }
};

export const checkAuth = async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided ❌" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const [rows] = await pool.query(
            "SELECT id, name, email FROM users WHERE id = ?",
            [decoded.id]
        );
        if (rows.length === 0) {
            return res.status(401).json({ message: "Unauthorized: User not found ❌" });
        }
        const user = rows[0];
        const [firstName, lastName] = user.name ? user.name.split(' ') : ['', ''];
        return res.status(200).json({
            message: "Authorized ✅",
            user: {
                id: user.id,
                first_name: firstName,
                last_name: lastName || '',
                email: user.email,
                phone_number: '',
                dob: ''
            }
        });
    } catch (error) {
        console.error("Auth check error:", error);
        return res.status(401).json({ message: "Unauthorized: Invalid token ❌", error: error.message });
    }
};
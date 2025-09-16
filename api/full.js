// Full API function with all routes
import serverless from "serverless-http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = [
            "http://localhost:3000",
            "https://www.shubhakuteer.in"
        ];
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Test endpoint
app.get("/api/test", (req, res) => {
    res.json({ 
        message: "Full API is working", 
        timestamp: new Date().toISOString()
    });
});

// Health check with database
app.get("/api/health", async (req, res) => {
    try {
        const pool = await import("../backend/utils/db.js");
        const [rows] = await pool.default.query("SELECT 1 as test");
        res.json({
            status: "healthy",
            database: "connected",
            timestamp: new Date().toISOString(),
            test: rows[0]
        });
    } catch (error) {
        console.error("Health check error:", error);
        res.status(500).json({
            status: "unhealthy",
            database: "disconnected",
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Auth routes
app.post("/api/auth/register", async (req, res) => {
    try {
        const { registerUser } = await import("../backend/controllers/authController.js");
        await registerUser(req, res);
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { loginUser } = await import("../backend/controllers/authController.js");
        await loginUser(req, res);
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed", error: error.message });
    }
});

// Catch all
app.get("*", (req, res) => {
    res.json({ 
        message: "Full API function is running", 
        path: req.path,
        method: req.method
    });
});

export const handler = serverless(app);

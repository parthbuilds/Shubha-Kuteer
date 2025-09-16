// Minimal serverless function to test basic functionality
import serverless from "serverless-http";
import express from "express";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint
app.get("/api/test", (req, res) => {
    res.json({ 
        message: "API is working", 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

// Health check without database
app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

// Catch all for testing
app.get("*", (req, res) => {
    res.json({ 
        message: "Serverless function is running", 
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

export const handler = serverless(app);
// Simple test function to isolate the issue
import serverless from "serverless-http";
import express from "express";

const app = express();

app.use(express.json());

app.get("/api/test", (req, res) => {
    res.json({ 
        message: "Test API is working", 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

app.get("*", (req, res) => {
    res.json({ 
        message: "Test function is running", 
        path: req.path,
        method: req.method
    });
});

export const handler = serverless(app);

// Test database connection utility
import pool from "./db.js";

export const testConnection = async () => {
    try {
        console.log("Testing database connection...");
        const [rows] = await pool.query("SELECT 1 as test");
        console.log("✅ Database connection successful:", rows);
        return { success: true, data: rows };
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        return { success: false, error: error.message };
    }
};

// Test function for debugging
export const debugConnection = async () => {
    console.log("Environment variables:");
    console.log("DB_HOST:", process.env.DB_HOST ? "✅ Set" : "❌ Missing");
    console.log("DB_USER:", process.env.DB_USER ? "✅ Set" : "❌ Missing");
    console.log("DB_PASS:", process.env.DB_PASS ? "✅ Set" : "❌ Missing");
    console.log("DB_NAME:", process.env.DB_NAME ? "✅ Set" : "❌ Missing");
    console.log("DB_PORT:", process.env.DB_PORT || "3306 (default)");
    
    return await testConnection();
};

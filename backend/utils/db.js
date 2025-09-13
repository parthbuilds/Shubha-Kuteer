import mysql from "mysql2/promise";
import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Correctly resolve __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export the pool using the ES Module default export syntax
export default pool;

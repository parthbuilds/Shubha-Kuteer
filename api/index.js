import pool from "../utils/db.js";
import fs from "fs/promises";
import path from "path";

export default async function handler(req, res) {
    const url = req.url || "";
    const method = req.method;

    // ---------------- AUTH ----------------
    if (url.startsWith("/auth")) {
        if (method === "POST" && url.endsWith("/login")) {
            // call login controller
            return res.json({ message: "login route" });
        }
        if (method === "POST" && url.endsWith("/register")) {
            // call register controller
            return res.json({ message: "register route" });
        }
    }

    // ---------------- PRODUCTS ----------------
    if (url.startsWith("/products")) {
        if (method === "GET" && url === "/products") {
            const [rows] = await pool.query("SELECT * FROM products");
            return res.json(rows);
        }

        if (method === "POST" && url === "/products") {
            // handle product insert
            return res.json({ message: "product created" });
        }

        if (method === "DELETE" && url.startsWith("/products/")) {
            const id = url.split("/").pop();
            await pool.query("DELETE FROM products WHERE id = ?", [id]);
            return res.json({ message: `product ${id} deleted` });
        }
    }

    // ---------------- CATEGORIES ----------------
    if (url.startsWith("/categories")) {
        if (method === "GET" && url === "/categories") {
            const [rows] = await pool.query("SELECT * FROM categories");
            return res.json(rows);
        }

        if (method === "GET" && url === "/categories/public") {
            const [rows] = await pool.query(`
        SELECT c.id, c.name, COUNT(p.id) as count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        GROUP BY c.id
      `);
            return res.json(rows);
        }

        if (method === "POST" && url === "/categories") {
            // handle category insert
            return res.json({ message: "category created" });
        }

        if (method === "DELETE" && url.startsWith("/categories/")) {
            const id = url.split("/").pop();
            await pool.query("DELETE FROM categories WHERE id = ?", [id]);
            return res.json({ message: `category ${id} deleted` });
        }
    }

    // ---------------- USERS ----------------
    if (url.startsWith("/users")) {
        if (method === "GET" && url === "/users") {
            const [rows] = await pool.query("SELECT * FROM users");
            return res.json(rows);
        }
    }

    // ---------------- ORDERS ----------------
    if (url.startsWith("/orders")) {
        if (method === "GET" && url === "/orders") {
            const [rows] = await pool.query("SELECT * FROM orders");
            return res.json(rows);
        }
    }

    // ---------------- DEFAULT ----------------
    return res.status(404).json({ message: "Route not found" });
}

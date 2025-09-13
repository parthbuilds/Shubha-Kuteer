import express from "express";
import pool from "../utils/db.js";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";

const router = express.Router();

// Vercel FS is read-only. This path will NOT persist.
// Replace with Cloudinary/S3/Supabase upload later.
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadPath = path.join(__dirname, "../../assets/categories");
fs.mkdir(uploadPath, { recursive: true }).catch(console.error);

// 🔹 POST → Add new category
router.post("/", async (req, res) => {
    try {
        let { name, sale, data_item, icon } = req.body;
        if (!name || !icon) {
            return res.status(400).json({ message: "Name and icon are required!" });
        }

        if (!data_item || data_item.trim() === "") {
            data_item = name.toLowerCase().replace(/\s+/g, "-");
        }

        const iconPath = typeof icon === "string" ? icon : `/assets/categories/${Date.now()}.png`;

        await pool.query(
            "INSERT INTO categories (name, data_item, icon, sale) VALUES (?, ?, ?, ?)",
            [name, data_item, iconPath, sale || 0]
        );

        return res.status(200).json({
            message: "Category added successfully!",
            data: { name, data_item, icon: iconPath, sale }
        });
    } catch (err) {
        console.error("Failed to add category", err);
        return res.status(500).json({ message: "Failed to add category", error: err.message });
    }
});

// 🔹 GET → Fetch all categories
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM categories ORDER BY id DESC");
        const formatted = rows.map(cat => ({
            id: cat.id,
            name: cat.name,
            dataItem: cat.data_item,
            icon: cat.icon,
            sale: cat.sale || 0,
            count: cat.count || 0,
            createdAt: cat.created_at,
            slug: cat.name.toLowerCase().replace(/\s+/g, "-"),
        }));
        return res.status(200).json(formatted);
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch categories", error: err.message });
    }
});

// 🔹 DELETE → Delete category
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT icon FROM categories WHERE id = ?", [id]);
        if (!rows.length) return res.status(404).json({ message: "Category not found" });
        const iconPath = rows[0].icon;
        if (iconPath) {
            const fullPath = path.join(process.cwd(), iconPath);
            try { await fs.unlink(fullPath); } catch (e) {}
        }
        await pool.query("DELETE FROM categories WHERE id = ?", [id]);
        return res.status(200).json({ message: "Category deleted successfully!" });
    } catch (err) {
        return res.status(500).json({ message: "Failed to delete category", error: err.message });
    }
});

export default router;

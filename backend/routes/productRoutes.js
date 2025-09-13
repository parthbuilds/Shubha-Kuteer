import express from "express";
import pool from "../utils/db.js";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";

const router = express.Router();

// Upload dir (⚠️ will not persist on Vercel – use external storage instead)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadPath = path.join(__dirname, "../../assets/uploads");
fs.mkdir(uploadPath, { recursive: true }).catch(console.error);

// 🔹 GET /api/products
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM products ORDER BY created_at DESC");

        const products = rows.map(p => ({
            id: p.id,
            category: p.category,
            type: p.type,
            name: p.name,
            new: !!p.is_new,
            sale: !!p.on_sale,
            rate: p.rate,
            price: p.price,
            originPrice: p.origin_price,
            brand: p.brand,
            sold: p.sold,
            quantity: p.quantity,
            quantityPurchase: p.quantity_purchase,
            sizes: p.sizes ? JSON.parse(p.sizes) : [],
            variation: p.variations ? JSON.parse(p.variations) : [],
            thumbImage: p.main_image ? [p.main_image] : [],
            images: p.gallery ? JSON.parse(p.gallery) : [],
            description: p.description,
            slug: p.slug,
        }));
        return res.status(200).json(products);
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch products", error: err.message });
    }
});

// 🔹 POST → Add new product
router.post("/", async (req, res) => {
    const { name, category, price, quantity, brand } = req.body;
    if (!name || !category || !price || !quantity) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {
        const [result] = await pool.query(
            "INSERT INTO products (name, category, price, quantity, brand) VALUES (?, ?, ?, ?, ?)",
            [name, category, price, quantity, brand]
        );
        res.status(201).json({ message: "Product added successfully", id: result.insertId });
    } catch (err) {
        return res.status(500).json({ message: "Failed to add product", error: err.message });
    }
});

// 🔹 DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query("SELECT main_image, gallery FROM products WHERE id = ?", [id]);
        if (!rows.length) return res.status(404).json({ message: "Product not found" });

        const product = rows[0];
        await pool.query("DELETE FROM products WHERE id = ?", [id]);

        const deleteFiles = async (files) => {
            await Promise.all(files.map(async (file) => {
                if (!file) return;
                const fullPath = path.join(process.cwd(), file);
                try { await fs.unlink(fullPath); } catch {}
            }));
        };

        let galleryFiles = [];
        try { galleryFiles = JSON.parse(product.gallery || "[]"); } catch {}
        await deleteFiles([product.main_image, ...galleryFiles]);

        return res.status(200).json({ message: "Product and files deleted successfully" });
    } catch (err) {
        return res.status(500).json({ message: "Failed to delete product", error: err.message });
    }
});

export default router;

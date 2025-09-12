const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const pool = require("../utils/db");

const router = express.Router();

// Upload dir
const uploadPath = path.join(__dirname, "../../assets/uploads");
fs.mkdir(uploadPath, { recursive: true }).catch(console.error);

// Multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 🔹 GET products
router.get("/", async (_req, res) => {
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
            action: p.action
        }));

        res.json(products);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch products", error: err.message });
    }
});

// 🔹 POST product
router.post("/", upload.fields([{ name: "mainImage", maxCount: 1 }, { name: "gallery" }]), async (req, res) => {
    try {
        const {
            name, category, price, description, type, is_new, on_sale,
            rate, origin_price, brand, sold, quantity, quantity_purchase, slug, action
        } = req.body;

        let sizes = [];
        let variations = [];
        try {
            sizes = req.body.sizes ? JSON.parse(req.body.sizes) : [];
            variations = req.body.variations ? JSON.parse(req.body.variations) : [];
        } catch {}

        const main_image = req.files?.mainImage ? `/assets/uploads/${req.files.mainImage[0].filename}` : null;
        const galleryFiles = req.files?.gallery ? req.files.gallery.map(f => `/assets/uploads/${f.filename}`) : [];
        const finalSlug = slug || (name ? name.toLowerCase().replace(/\s+/g, "-") : null);

        await pool.query(
            `INSERT INTO products
            (name, category, type, brand, price, origin_price, description, quantity, sold, quantity_purchase, is_new, on_sale, rate, slug, main_image, thumb_image, gallery, sizes, variations, created_at, action)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
            [
                name || null,
                category || null,
                type || null,
                brand || null,
                price || 0,
                origin_price || null,
                description || null,
                parseInt(quantity) || 0,
                parseInt(sold) || 0,
                parseInt(quantity_purchase) || 0,
                is_new ? 1 : 0,
                on_sale ? 1 : 0,
                parseFloat(rate) || 0,
                finalSlug,
                main_image,
                main_image,
                JSON.stringify(galleryFiles),
                JSON.stringify(sizes),
                JSON.stringify(variations),
                action || null
            ]
        );

        res.json({ message: "Product added successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Failed to add product", error: err.message });
    }
});

// 🔹 DELETE product
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
                const fullPath = path.join(__dirname, "../../", file);
                try { await fs.unlink(fullPath); } catch {}
            }));
        };

        let galleryFiles = [];
        try { galleryFiles = JSON.parse(product.gallery || "[]"); } catch {}
        await deleteFiles([product.main_image, ...galleryFiles]);

        res.json({ message: "Product and files deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete product" });
    }
});

module.exports = router;

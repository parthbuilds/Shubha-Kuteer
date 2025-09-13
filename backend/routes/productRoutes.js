// routes/productRoutes.js
import express from "express";
import pool from "../utils/db.js";
import path from "path";
import fs from "fs/promises";
import multer from "multer";

const router = express.Router();

// --- Multer setup for file uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), "/public/products")),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// 🔹 POST → Add new product
router.post("/", upload.fields([{ name: "image", maxCount: 1 }, { name: "file", maxCount: 1 }]), async (req, res) => {
  try {
    const {
      name,
      slug,
      price,
      origin_price,
      quantity,
      sold,
      quantity_purchase,
      rate,
      is_new,
      on_sale,
      sizes,
      variations,
      category,
    } = req.body;

    if (!name || !category) return res.status(400).json({ message: "Product name and category are required!" });

    // Parse JSON fields
    const sizesJSON = sizes ? JSON.parse(sizes) : [];
    const variationsJSON = variations ? JSON.parse(variations) : {};

    // Files
    const imageFile = req.files?.image?.[0]?.path.replace(process.cwd(), "") || "/images/products/default.png";
    const productFile = req.files?.file?.[0]?.path.replace(process.cwd(), "") || null;

    // Auto-generate slug
    const finalSlug = slug?.trim() ? slug : name.toLowerCase().replace(/\s+/g, "-");

    // Insert into DB
    const [result] = await pool.query(
      `INSERT INTO products 
        (name, slug, price, origin_price, quantity, sold, quantity_purchase, rate, is_new, on_sale, sizes, variations, category_id, image, file)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
          (SELECT id FROM categories WHERE name=? LIMIT 1), ?, ?)`,
      [
        name,
        finalSlug,
        price || 0,
        origin_price || 0,
        quantity || 0,
        sold || 0,
        quantity_purchase || 0,
        rate || 0,
        is_new ? 1 : 0,
        on_sale ? 1 : 0,
        JSON.stringify(sizesJSON),
        JSON.stringify(variationsJSON),
        category,
        imageFile,
        productFile,
      ]
    );

    return res.status(200).json({ message: "Product added successfully!", productId: result.insertId });
  } catch (err) {
    console.error("Failed to add product:", err);
    return res.status(500).json({ message: "Failed to add product", error: err.message });
  }
});

// 🔹 GET → Fetch all products (optional)
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY id DESC");
    return res.status(200).json(rows);
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
});

export default router;

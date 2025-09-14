import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

/**
 * POST /api/admin/products
 * Add new product safely
 */
router.post("/", async (req, res) => {
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
      description,
      type,
      brand,
      main_image,
      gallery
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: "Product name and category are required!" });
    }

    // --- Sizes & Variations ---
    let sizesJSON = "[]";
    let variationsJSON = "{}";
    try { if (sizes) sizesJSON = JSON.stringify(JSON.parse(sizes)); } catch {}
    try { if (variations) variationsJSON = JSON.stringify(JSON.parse(variations)); } catch {}

    // --- Main Image ---
    const mainImageURL = main_image || "https://via.placeholder.com/400x400?text=No+Image";

    // --- Gallery handling (safe) ---
    let galleryURLs = [];
    if (Array.isArray(gallery)) {
      galleryURLs = gallery;
    } else if (typeof gallery === "string" && gallery.length > 0) {
      try { galleryURLs = JSON.parse(gallery); } 
      catch { galleryURLs = gallery.split(","); }
    }

    // --- Auto-slug ---
    const finalSlug = slug?.trim() || name.toLowerCase().replace(/\s+/g, "-");

    // --- Numeric defaults ---
    const finalPrice = Number(price) || 0;
    const finalOriginPrice = Number(origin_price) || 0;
    const finalQuantity = Number(quantity) || 0;
    const finalSold = Number(sold) || 0;
    const finalQuantityPurchase = Number(quantity_purchase) || 0;
    const finalRate = Number(rate) || 0;

    // --- Insert into database (category as string) ---
    const [result] = await pool.query(
      `INSERT INTO products
        (name, slug, price, origin_price, quantity, sold, quantity_purchase, rate,
         is_new, on_sale, sizes, variations, category, main_image, gallery, description, type, brand)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        finalSlug,
        finalPrice,
        finalOriginPrice,
        finalQuantity,
        finalSold,
        finalQuantityPurchase,
        finalRate,
        is_new ? 1 : 0,
        on_sale ? 1 : 0,
        sizesJSON,
        variationsJSON,
        category,
        mainImageURL,
        JSON.stringify(galleryURLs),
        description || "",
        type || "",
        brand || ""
      ]
    );

    return res.status(200).json({
      message: "✅ Product added successfully!",
      productId: result.insertId,
      main_image: mainImageURL,
      gallery: galleryURLs
    });

  } catch (err) {
    console.error("❌ Failed to add product:", err);
    return res.status(500).json({ message: "Failed to add product", error: err.message });
  }
});

/**
 * GET /api/admin/products
 * Fetch all products
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY created_at DESC");
    return res.status(200).json(rows);
  } catch (err) {
    console.error("❌ Failed to fetch products:", err);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
});

export default router;

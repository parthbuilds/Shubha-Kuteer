import path from "path";
import fs from "fs/promises";
import pool from "../utils/db.js";

// Upload dir (⚠️ will not persist on Vercel – use external storage instead)
const uploadPath = path.join(process.cwd(), "assets/uploads");
fs.mkdir(uploadPath, { recursive: true }).catch(console.error);

export default async function handler(req, res) {
    const url = req.url || "";
    const method = req.method;

    // 🔹 GET /api/products
    if (method === "GET" && url === "/") {
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

            return res.status(200).json(products);
        } catch (err) {
            return res.status(500).json({ message: "Failed to fetch products", error: err.message });
        }
    }

    // 🔹 POST /api/products
    if (method === "POST" && url === "/") {
        try {
            // On Vercel, req.body is already parsed (JSON).
            const {
                name, category, price, description, type, is_new, on_sale,
                rate, origin_price, brand, sold, quantity, quantity_purchase, slug, action,
                sizes = "[]",
                variations = "[]",
                main_image = null,
                gallery = "[]"
            } = req.body;

            let parsedSizes = [];
            let parsedVariations = [];
            let galleryFiles = [];

            try { parsedSizes = JSON.parse(sizes); } catch {}
            try { parsedVariations = JSON.parse(variations); } catch {}
            try { galleryFiles = JSON.parse(gallery); } catch {}

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
                    JSON.stringify(parsedSizes),
                    JSON.stringify(parsedVariations),
                    action || null
                ]
            );

            return res.status(200).json({ message: "Product added successfully!" });
        } catch (err) {
            return res.status(500).json({ message: "Failed to add product", error: err.message });
        }
    }

    // 🔹 DELETE /api/products/:id
    if (method === "DELETE" && url.startsWith("/")) {
        const id = url.split("/").pop();
        try {
            const [rows] = await pool.query("SELECT main_image, gallery FROM products WHERE id = ?", [id]);
            if (!rows.length) return res.status(404).json({ message: "Product not found" });

            const product = rows[0];
            await pool.query("DELETE FROM products WHERE id = ?", [id]);

            // Try to delete associated files (⚠️ won’t persist on Vercel)
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
    }

    // Default: method not allowed
    return res.status(405).json({ message: "Method not allowed" });
}

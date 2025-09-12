import path from "path";
import fs from "fs/promises";
import pool from "../utils/db.js";

// ⚠️ Vercel FS is read-only. This path will NOT persist.
// Replace with Cloudinary/S3/Supabase upload later.
const uploadPath = path.join(process.cwd(), "assets/categories");
fs.mkdir(uploadPath, { recursive: true }).catch(console.error);

export default async function handler(req, res) {
    const url = req.url || "";
    const method = req.method;

    // 🔹 POST /api/categories → Add new category
    if (method === "POST" && url === "/") {
        try {
            let { name, sale, data_item, icon } = req.body;

            if (!name || !icon) {
                return res.status(400).json({ message: "Name and icon are required!" });
            }

            if (!data_item || data_item.trim() === "") {
                data_item = name.toLowerCase().replace(/\s+/g, "-");
            }

            // On Vercel: expect `icon` as a URL or base64, not an uploaded file
            const iconPath = typeof icon === "string" ? icon : `/assets/categories/${Date.now()}.png`;

            await pool.query(
                "INSERT INTO categories (name, data_item, icon, sale) VALUES (?, ?, ?, ?)",
                [name, data_item, iconPath, sale || 0]
            );

            return res.status(200).json({
                message: "Category added successfully!",
                data: { name, data_item, icon: iconPath, sale: sale || 0 },
            });
        } catch (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ message: "Failed to add category", error: err.message });
        }
    }

    // 🔹 GET /api/categories → Get all (admin)
    if (method === "GET" && url === "/") {
        try {
            const [rows] = await pool.query("SELECT * FROM categories ORDER BY created_at DESC");
            return res.status(200).json(rows);
        } catch (err) {
            return res.status(500).json({ message: "Failed to fetch categories", error: err.message });
        }
    }

    // 🔹 GET /api/categories/public → Get public (with product count)
    if (method === "GET" && url === "/public") {
        try {
            const [rows] = await pool.query(`
                SELECT c.id, c.name, c.data_item, c.icon, c.sale, c.created_at, COUNT(p.id) AS count
                FROM categories c
                LEFT JOIN products p ON p.category_id = c.id
                GROUP BY c.id
                ORDER BY c.created_at DESC
            `);

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
    }

    // 🔹 DELETE /api/categories/:id
    if (method === "DELETE" && url.startsWith("/")) {
        const id = url.split("/").pop();
        try {
            const [rows] = await pool.query("SELECT icon FROM categories WHERE id = ?", [id]);
            if (!rows.length) return res.status(404).json({ message: "Category not found" });

            const iconPath = rows[0].icon;
            if (iconPath) {
                const fullPath = path.join(process.cwd(), iconPath);
                try { await fs.unlink(fullPath); } catch {}
            }

            await pool.query("DELETE FROM categories WHERE id = ?", [id]);
            return res.status(200).json({ message: "Category deleted successfully!" });
        } catch (err) {
            return res.status(500).json({ message: "Failed to delete category", error: err.message });
        }
    }

    // Default
    return res.status(405).json({ message: "Method not allowed" });
}

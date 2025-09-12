const pool = require("../utils/db");
const url = require("url");

export default async function handler(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const id = pathParts.length > 1 ? pathParts[1] : null;

    if (req.method === "POST" && !id) {
        // Create Attribute
        const { category_id, attribute_name, attribute_value } = req.body;
        if (!category_id || !attribute_name || !attribute_value) {
            return res.status(400).json({ 
                error: "Missing required fields: category_id, attribute_name, attribute_value" 
            });
        }
        try {
            const [result] = await pool.query(
                "INSERT INTO attributes (category_id, attribute_name, attribute_value) VALUES (?, ?, ?)",
                [category_id, attribute_name, attribute_value]
            );
            res.status(201).json({
                success: true,
                id: result.insertId,
                message: "Attribute added successfully"
            });
        } catch (err) {
            console.error("DB Insert Error:", err);
            res.status(500).json({ error: "Server error. Could not add attribute." });
        }
    } else if (req.method === "GET" && !id) {
        // Fetch All Attributes
        try {
            const [rows] = await pool.query(
                `SELECT a.id, c.name AS category_name, a.attribute_name, a.attribute_value, a.created_at
                 FROM attributes a
                 JOIN categories c ON a.category_id = c.id
                 ORDER BY a.id DESC`
            );
            res.json(rows);
        } catch (err) {
            console.error("DB Fetch Error:", err);
            res.status(500).json({ error: "Server error. Could not retrieve attributes." });
        }
    } else if (req.method === "DELETE" && id) {
        // Delete Attribute
        try {
            const [result] = await pool.query("DELETE FROM attributes WHERE id = ?", [id]);
            if (!result.affectedRows) return res.status(404).json({ error: `Attribute with ID ${id} not found.` });
            res.json({ success: true, message: `Attribute with ID ${id} deleted successfully` });
        } catch (err) {
            console.error("DB Delete Error:", err);
            res.status(500).json({ error: "Server error. Could not delete attribute." });
        }
    } else {
        res.status(405).json({ error: "Method not allowed" });
    }
}
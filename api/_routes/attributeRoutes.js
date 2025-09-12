const express = require("express");
const pool = require("../utils/db");
const router = express.Router();

// --- Create Attribute ---
router.post("/", async (req, res) => {
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
});

// --- Fetch All Attributes ---
router.get("/", async (_req, res) => {
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
});

// --- Delete Attribute ---
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await pool.query("DELETE FROM attributes WHERE id = ?", [id]);
        if (!result.affectedRows) return res.status(404).json({ error: `Attribute with ID ${id} not found.` });
        res.json({ success: true, message: `Attribute with ID ${id} deleted successfully` });
    } catch (err) {
        console.error("DB Delete Error:", err);
        res.status(500).json({ error: "Server error. Could not delete attribute." });
    }
});

module.exports = router;

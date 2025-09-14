import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const { category_id, attribute_name, attribute_value, attribute_hash } = req.body;

    if (!category_id || !attribute_name || !attribute_value) {
        return res.status(400).json({
            error: "Missing required fields: category_id, attribute_name, attribute_value",
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO attributes (category_id, attribute_name, attribute_value, attribute_hash) 
            VALUES (?, ?, ?, ?)`,
            [category_id, attribute_name, attribute_value, attribute_hash || null]
        );

        res.status(201).json({
            success: true,
            id: result.insertId,
            message: "Attribute added successfully",
        });
    } catch (err) {
        console.error("DB Insert Error:", err);
        res.status(500).json({ error: "Server error. Could not add attribute." });
    }
});

// GET endpoint unchanged
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.id, a.attribute_name, a.attribute_value, a.created_at,
                   c.name AS category_name
            FROM attributes a
            LEFT JOIN categories c ON a.category_id = c.id
            ORDER BY a.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("DB Fetch Error:", err);
        res.status(500).json({ error: "Server error. Could not fetch attributes." });
    }
});

// DELETE → Remove attribute by ID
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM attributes WHERE id = ?", [id]);
        res.json({ success: true, message: "Attribute deleted successfully" });
    } catch (err) {
        console.error("DB Delete Error:", err);
        res.status(500).json({ error: "Server error. Could not delete attribute." });
    }
});

export default router;

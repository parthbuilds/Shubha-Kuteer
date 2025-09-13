import express from "express";
import pool from "../utils/db.js";

const router = express.Router();

// GET all attributes
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
    res.status(500).json({ error: "Server error fetching attributes" });
  }
});

// POST
router.post("/", async (req, res) => {
  const { category_id, attribute_name, attribute_value } = req.body;
  if (!category_id || !attribute_name || !attribute_value)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const [result] = await pool.query(
      "INSERT INTO attributes (category_id, attribute_name, attribute_value) VALUES (?, ?, ?)",
      [category_id, attribute_name, attribute_value]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("DB Insert Error:", err);
    res.status(500).json({ error: "Server error adding attribute" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM attributes WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("DB Delete Error:", err);
    res.status(500).json({ error: "Server error deleting attribute" });
  }
});

export default router;

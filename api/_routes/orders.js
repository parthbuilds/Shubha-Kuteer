const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const pool = require("../utils/db");
require("dotenv").config();

// =====================
// 🔹 Razorpay Instance
// =====================
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================
// 🔹 Create Razorpay Order
// =====================
router.post("/create-order", async (req, res) => {
    const {
        first_name,
        last_name,
        email,
        phone_number,
        region,
        city,
        apartment,
        country,
        postal_code,
        note,
        amount, // total amount for Razorpay
        price,  // price of product
        quantity // quantity purchased
    } = req.body;

    try {
        const amt = parseFloat(amount);
        if (!amt || isNaN(amt) || amt <= 0) {
            return res.status(400).json({ success: false, error: "Invalid amount" });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: amt * 100,
            currency: "INR",
            receipt: "receipt_" + Date.now(),
            payment_capture: 1,
        });

        // Insert pending order into DB
        const [result] = await pool.query(
            `INSERT INTO orders 
            (first_name, last_name, email, phone_number, region, city, apartment, country, postal_code, note, price, quantity, payment_method, payment_status, razorpay_order_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Razorpay', 'pending', ?)`,
            [
                first_name,
                last_name,
                email,
                phone_number,
                region,
                city,
                apartment,
                country,
                postal_code,
                note,
                price,
                quantity,
                razorpayOrder.id,
            ]
        );

        res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            razorpay_order: razorpayOrder,
            order_id: result.insertId,
        });
    } catch (err) {
        console.error("❌ Error creating Razorpay order:", err);
        res.status(500).json({ success: false, error: "Failed to create order" });
    }
});

// =====================
// 🔹 Capture Payment
// =====================
router.post("/capture-order", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, payment_status } = req.body;

    try {
        await pool.query(
            `UPDATE orders 
             SET payment_status = ?, razorpay_payment_id = ? 
             WHERE razorpay_order_id = ?`,
            [payment_status, razorpay_payment_id, razorpay_order_id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("❌ Error capturing Razorpay order:", err);
        res.status(500).json({ success: false, error: "Failed to capture order" });
    }
});

// =====================
// 🔹 Get All Orders
// =====================
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        console.error("❌ Error fetching orders:", err);
        res.status(500).json({ message: "Server error" });
    }
});
// Get order by ID
router.get("/:id", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        res.json(rows[0]); // return single order
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

// =====================
// 🔹 Delete Order
// =====================
router.delete("/:id", async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM orders WHERE id = ?", [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ message: "Order deleted successfully" });
    } catch (err) {
        console.error("❌ Error deleting order:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;

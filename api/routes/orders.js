const Razorpay = require("razorpay");
const pool = require("../utils/db");

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
    if (req.method === "POST" && req.url.endsWith("/create-order")) {
        const { amount, currency, receipt } = req.body;
        try {
            const order = await razorpay.orders.create({
                amount,
                currency,
                receipt,
            });
            res.status(201).json(order);
        } catch (err) {
            console.error("Razorpay error:", err);
            res.status(500).json({ message: "Payment gateway error" });
        }
    } else if (req.method === "POST" && req.url.endsWith("/verify-payment")) {
        // Payment verification logic here
        // You may need to parse raw body for webhook verification
        res.json({ message: "Payment verification endpoint (implement logic)" });
    } else if (req.method === "GET") {
        // List orders from DB
        try {
            const [orders] = await pool.query("SELECT * FROM orders ORDER BY id DESC");
            res.json(orders);
        } catch (err) {
            console.error("DB error:", err);
            res.status(500).json({ message: "Database error" });
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}
// backend/routes/userRoutes.js
const express = require("express");
const router = express.Router();

// Temporary user store
let users = [
    {
        email: "admin@example.com",
        password: "admin123",
        role: "admin",
        permissions: {
            addProduct: true,
            updateProduct: true,
            deleteProduct: true,
            applyDiscount: true,
            createCoupon: true
        }
    }
];

// Add new user (admin only)
router.post("/", (req, res) => {
    const { name, email, password, role, permissions } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = users.find(u => u.email === email);
    if (exists) {
        return res.status(400).json({ message: "User already exists" });
    }

    const newUser = { name, email, password, role, permissions };
    users.push(newUser);

    res.json({ message: "User added successfully ✅", user: newUser });
});

// List all users (debugging)
router.get("/", (req, res) => {
    res.json(users);
});

module.exports = router;
module.exports.users = users;
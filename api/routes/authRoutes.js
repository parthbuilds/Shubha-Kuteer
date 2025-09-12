// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();

// Example: login
router.post("/login", (req, res) => {
  res.json({ message: "Login route working ✅" });
});

// Example: register
router.post("/register", (req, res) => {
  res.json({ message: "Register route working ✅" });
});

module.exports = router;

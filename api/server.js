require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

// =========================
// 🔹 Middlewares
// =========================
app.use(cors({
    origin: "http://localhost:3000/public", // adjust for your frontend
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// =========================
// 🔹 Static Files
// =========================
// Serve everything in the root (optional, adjust if not needed)
app.use("/", express.static(path.join(__dirname, "..")));

// Serve assets folder (for categories + product uploads)
app.use("/assets", express.static(path.join(__dirname, "..", "assets")));

// Serve admin panel
app.use("/admin", express.static(path.join(__dirname, "..", "admin")));

// =========================
// 🔹 Routes
// =========================
const authRoutes = require("./routes/authRoutes");
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminAuth = require("./middlewares/adminAuth");
const adminUserRoutes = require("./routes/adminUserRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const attributeRoutes = require("./routes/attributeRoutes");
const ordersRoutes = require("./routes/orders");
const memberRoutes = require("./routes/routes");

// Public APIs
app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);

// Admin APIs (protected)
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/users", adminAuth, adminUserRoutes);
app.use("/api/admin/products", adminAuth, productRoutes);
app.use("/api/admin/categories", adminAuth, categoryRoutes);
app.use("/api/admin/attributes", adminAuth, attributeRoutes);

// Orders API
app.use("/api/orders", ordersRoutes);

// =========================
// 🔹 Admin protected pages
// =========================
app.get("/admin/index.html", adminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "admin", "index.html"));
});

// =========================
// 🔹 404 Handler
// =========================
app.use((req, res) => {
    console.log("404 →", req.originalUrl);
    res.status(404).json({
        message: "❌ API route not found",
        path: req.originalUrl
    });
});

// =========================
// 🔹 Start Server
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 User site running at: http://localhost:${PORT}`);
    console.log(`🛠️ Admin site running at: http://localhost:${PORT}/admin`);
    console.log(`📂 Assets served from: http://localhost:${PORT}/assets`);
});

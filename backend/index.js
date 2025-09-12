// api/index.js
const express = require("express");
const serverless = require("serverless-http");
const path = require("path");

const app = express();

// ✅ Serve User-Facing Site
const userPath = path.join(__dirname, "..", "public");
app.use("/", express.static(userPath));

// ✅ Serve Admin Panel
const adminPath = path.join(__dirname, "..", "public", "admin");
app.use("/admin", express.static(adminPath));

// ✅ Force /admin/* → admin/index.html
app.get("/admin/*", (req, res) => {
  res.sendFile(path.join(adminPath, "index.html"));
});

// ✅ Force / → user/index.html (but keep APIs working)
app.get("/", (req, res) => {
  res.sendFile(path.join(userPath, "index.html"));
});

// --- API ROUTES ---
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const attributeRoutes = require("./routes/attributeRoutes");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const ordersRoutes = require("./routes/orders");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");

// ✅ API prefix
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

// ✅ Export for serverless
module.exports = app;
module.exports.handler = serverless(app);

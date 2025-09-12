// api/index.js
const express = require("express");
const serverless = require("serverless-http");

const app = express();

// Import your routers
const adminAuthRoutes = require("./routes/adminAuthRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const attributeRoutes = require("./routes/attributeRoutes");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const ordersRoutes = require("./routes/orders");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");

// Mount them under a single handler
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

// Export wrapped as one serverless function
module.exports = app;
module.exports.handler = serverless(app);

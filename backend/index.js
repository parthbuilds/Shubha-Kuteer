import "dotenv/config";
import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import adminAuth from "./middlewares/adminAuth.js";

// Routes
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import attributeRoutes from "./routes/attributeRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import ordersRoutes from "./routes/orders.js";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// --- Define __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// --- USER-FACING PAGES ---
app.use(express.static(path.join(__dirname, "..", "public")));

// --- ADMIN LOGIN PAGE (public) ---
app.get("/admin/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public/admin/login.html"));
});

// --- ADMIN STATIC ASSETS ---
app.use("/admin/assets", express.static(path.join(__dirname, "..", "public/admin/assets")));

// --- PROTECTED ADMIN PAGES ---
app.get("/admin/:page", adminAuth, (req, res) => {
    const allowedPages = ["index.html", "dashboard.html"];
    const page = req.params.page;

    if (!allowedPages.includes(page)) return res.status(404).send("Page not found");

    res.sendFile(path.join(__dirname, "..", "public/admin", page));
});

// --- API ROUTES ---
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/attributes", attributeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

// --- Export for serverless ---
export { app };
export const handler = serverless(app);

// --- Local dev ---
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}

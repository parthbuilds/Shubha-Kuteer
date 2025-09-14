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

// --- ADMIN LOGIN PAGE (public) ---
app.get("/admin/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "public/admin/login.html"));
});

// --- ADMIN STATIC ASSETS ---
app.use("/admin/assets", express.static(path.join(__dirname, "..", "public/admin/assets")));

// --- API ROUTES (must come BEFORE admin page routes) ---
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/attributes", attributeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/categories", categoryRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/admin/products", productRoutes);
app.use("/api/users", userRoutes);

// --- PROTECTED ADMIN PAGES ---
// Use /admin/pages/:page instead of /admin/:page
app.get("/admin/pages/:page", adminAuth, (req, res) => {
    const page = req.params.page;
    if (!page.endsWith(".html")) return res.status(404).send("Page not found");
    res.sendFile(path.join(__dirname, "..", "public/admin", page));
});

// --- USER-FACING PAGES ---
app.use(express.static(path.join(__dirname, "..", "public")));

// --- Uploads ---
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

// --- Export for serverless ---
export default app;
export const handler = serverless(app);

// --- Local dev ---
if (process.env.NODE_ENV !== "production") {
    app.listen(PORT, () => {
        console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
}
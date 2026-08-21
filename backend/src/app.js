// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import groceryProductRoutes from "./routes/groceryProductRoutes.js";
import groceriesRoutes from "./routes/groceriesRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import telegramRoutes from "./routes/telegramRoutes.js";

const app = express();

// --------------------------------------------------
// CORS
// --------------------------------------------------

const allowedOrigins = [
  "https://aliauf.com",
  "https://www.aliauf.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin
      // (Postman, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// --------------------------------------------------
// Routes
// --------------------------------------------------

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/seller", sellerRoutes);
app.use("/api/delivery", deliveryRoutes);

app.use("/api/seller/grocery", groceryProductRoutes);
app.use("/api/groceries", groceriesRoutes);

app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/cities", cityRoutes);
app.use("/api/telegram", telegramRoutes);

// --------------------------------------------------
// Health Check Route
// --------------------------------------------------

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend Server Running Successfully 🚀",
  });
});

export default app;

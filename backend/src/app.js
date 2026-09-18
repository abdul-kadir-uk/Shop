// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import groceryProductRoutes from "./routes/groceryProductRoutes.js";
import mobileProductRoutes from "./routes/mobileProductRoutes.js";
import groceriesRoutes from "./routes/groceriesRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import telegramRoutes from "./routes/telegramRoutes.js";
import mobileRoutes from "./routes/mobileRoutes.js";
import mobileCartRoutes from "./routes/mobileCartRoutes.js";
import mobileCheckoutRoutes from "./routes/mobileCheckoutRoutes.js";
import mobileOrderRoutes from "./routes/mobileOrderRoutes.js";
import mobileSellerOrderRoutes from "./routes/mobileSellerOrderRoutes.js";
import mobileDeliveryOrderRoutes from "./routes/mobileDeliveryOrderRoutes.js";

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

app.use("/api/seller/mobile", mobileProductRoutes);
app.use("/api/mobiles", mobileRoutes);

app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/mobile-cart", mobileCartRoutes);
app.use("/api/mobile-checkout", mobileCheckoutRoutes);
app.use("/api/mobile-orders", mobileOrderRoutes);

app.use("/api/cities", cityRoutes);
app.use("/api/telegram", telegramRoutes);

app.use("/api/seller/mobile-orders", mobileSellerOrderRoutes);
app.use("/api/delivery/mobile-orders", mobileDeliveryOrderRoutes);

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

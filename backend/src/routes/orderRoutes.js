import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  placeOrder,
  getMyOrders,
  getSingleOrder,
  cancelOrder,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/", protect, placeOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/:orderId", protect, getSingleOrder);
router.patch("/:orderId/cancel", protect, cancelOrder);

export default router;

/* ==========================================================
   Get Single Order
   GET /api/orders/:orderId
========================================================== */
import mongoose from "mongoose";

export const getSingleOrder = async (req, res) => {
  try {
    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can access orders.",
      });
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id.",
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order id is required.",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      customer: customer._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order.",
    });
  }
};

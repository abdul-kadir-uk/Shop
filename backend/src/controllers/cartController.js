import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import GroceryProduct from "../models/GroceryProduct.js";
import Seller from "../models/Seller.js";
import Customer from "../models/Customer.js";

/* ======================================================
   Helper
====================================================== */

const getVariantData = (product, variantIndex) => {
  if (
    variantIndex === undefined ||
    variantIndex === null ||
    variantIndex === -1
  ) {
    return {
      price: product.price,
      discountPrice: product.discountPrice || null,
      label: null,
    };
  }

  if (
    !product.variants ||
    variantIndex < 0 ||
    variantIndex >= product.variants.length
  ) {
    return null;
  }

  const variant = product.variants[variantIndex];

  return {
    price: variant.price,
    discountPrice: variant.discountPrice || null,
    label: variant.label,
  };
};

/* ======================================================
   Add To Cart
   POST /api/cart/add
====================================================== */

export const addToCart = async (req, res) => {
  try {
    const user = req.user;

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // Only customers can add items to cart
    if (user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can use cart.",
      });
    }

    const { productId, quantity = 1, variantIndex = -1 } = req.body;

    // Validate Product Id
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id.",
      });
    }

    // Quantity Validation
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1.",
      });
    }

    // Find Product
    const product = await GroceryProduct.findOne({
      _id: productId,
      isDeleted: false,
      isAvailable: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Seller Exists
    const seller = await Seller.findById(product.sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    // Variant Validation
    const variant = getVariantData(product, variantIndex);

    if (!variant) {
      return res.status(400).json({
        success: false,
        message: "Selected variant not found.",
      });
    }

    // Find Customer Cart
    let cart = await Cart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      cart = await Cart.create({
        customer: customer._id,
        items: [],
      });
    }

    // Check Existing Item
    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.variantIndex === variantIndex,
    );

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({
        product: product._id,
        seller: product.sellerId,
        quantity: Number(quantity),
        variantIndex,
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product added to cart.",
      cartCount: cart.items.length,
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product to cart.",
    });
  }
};

/* ======================================================
   Get Cart
   GET /api/cart
====================================================== */

export const getCart = async (req, res) => {
  try {
    const user = req.user;

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // Only customers
    if (user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can access cart.",
      });
    }

    const cart = await Cart.findOne({
      customer: customer._id,
    }).populate({
      path: "items.product",
      populate: {
        path: "sellerId",
        select: "shopName",
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        cart: {
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
          totalItems: 0,
        },
      });
    }

    const cartItems = [];

    let subtotal = 0;
    let total = 0;
    let discount = 0;

    let hasChanges = false;

    for (const item of cart.items) {
      const product = item.product;

      // Product deleted
      if (!product) {
        hasChanges = true;
        continue;
      }

      // Product unavailable
      if (product.isDeleted || !product.isAvailable) {
        hasChanges = true;
        continue;
      }

      // Variant price
      const variant = getVariantData(product, item.variantIndex);

      if (!variant) {
        hasChanges = true;
        continue;
      }

      const originalPrice = variant.price;

      const sellingPrice = variant.discountPrice ?? variant.price;
      const itemSubtotal = originalPrice * item.quantity;

      const itemTotal = sellingPrice * item.quantity;

      subtotal += itemSubtotal;

      total += itemTotal;

      discount += itemSubtotal - itemTotal;

      cartItems.push({
        productId: product._id,

        productName: product.productName,

        slug: product.slug,

        brand: product.brand,

        image: product.mainImage?.url || null,

        seller: product.sellerId,

        variantIndex: item.variantIndex,

        variantLabel: variant.label,

        quantity: item.quantity,

        originalPrice,

        sellingPrice,

        subtotal: itemTotal,

        isAvailable: product.isAvailable,
      });
    }

    // Remove deleted/unavailable items automatically
    if (hasChanges) {
      cart.items = cart.items.filter((item) => {
        if (!item.product) return false;

        return (
          !item.product.isDeleted &&
          item.product.isAvailable &&
          getVariantData(item.product, item.variantIndex)
        );
      });

      await cart.save();
    }

    return res.status(200).json({
      success: true,
      cart: {
        items: cartItems,

        subtotal,

        discount,

        total,

        totalItems: cartItems.length,
        totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      },
    });
  } catch (error) {
    console.error("Get Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart.",
    });
  }
};

/* ======================================================
   Update Cart Quantity
   PATCH /api/cart/update
====================================================== */

export const updateCartQuantity = async (req, res) => {
  try {
    const user = req.user;

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can update cart.",
      });
    }

    const { productId, quantity, variantIndex = -1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id.",
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1.",
      });
    }

    const cart = await Cart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const item = cart.items.find(
      (item) =>
        item.product.toString() === productId &&
        item.variantIndex === variantIndex,
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart.",
      });
    }

    item.quantity = Number(quantity);

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully.",
    });
  } catch (error) {
    console.error("Update Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update cart.",
    });
  }
};

/* ======================================================
   Remove Cart Item
   DELETE /api/cart/remove/:productId
====================================================== */

export const removeCartItem = async (req, res) => {
  try {
    const user = req.user;

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can remove cart items.",
      });
    }

    const { productId } = req.params;
    const variantIndex = Number(req.query.variantIndex ?? -1);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product id.",
      });
    }

    const cart = await Cart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId &&
          item.variantIndex === variantIndex
        ),
    );

    if (initialLength === cart.items.length) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart.",
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from cart.",
      cartCount: cart.items.length,
    });
  } catch (error) {
    console.error("Remove Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove cart item.",
    });
  }
};

/* ======================================================
   Clear Cart
   DELETE /api/cart/clear
====================================================== */

export const clearCart = async (req, res) => {
  try {
    const user = req.user;

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can clear cart.",
      });
    }

    const cart = await Cart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    cart.items = [];

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear cart.",
    });
  }
};

/* ======================================================
   Cart Count
   GET /api/cart/count
====================================================== */

export const getCartCount = async (req, res) => {
  try {
    const user = req.user;

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    if (user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can access cart.",
      });
    }

    const cart = await Cart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        count: 0,
      });
    }

    const totalQuantity = cart.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return res.status(200).json({
      success: true,
      count: totalQuantity,
    });
  } catch (error) {
    console.error("Cart Count Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch cart count.",
    });
  }
};

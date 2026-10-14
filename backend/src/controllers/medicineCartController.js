// src/controllers/medicineCartController.js

import mongoose from "mongoose";
import MedicineCart from "../models/MedicineCart.js";
import MedicineProduct from "../models/MedicineProduct.js";
import Seller from "../models/Seller.js";
import Customer from "../models/Customer.js";

// Get medicine price and details for the selected variant
const getVariantData = (product, variantIndex = -1) => {
  if (
    variantIndex === undefined ||
    variantIndex === null ||
    Number(variantIndex) === -1
  ) {
    return {
      price: product.price,
      discountPrice: product.discountPrice || null,
      label: null,
      quantity: null,
      unit: product.unit || null,
    };
  }

  const index = Number(variantIndex);

  if (
    !Number.isInteger(index) ||
    index < 0 ||
    !Array.isArray(product.variants) ||
    index >= product.variants.length
  ) {
    return null;
  }

  const variant = product.variants[index];

  if (!variant) {
    return null;
  }

  return {
    price: variant.price,
    discountPrice: variant.discountPrice || null,
    label: variant.label || null,
    quantity: variant.quantity ?? null,
    unit: variant.unit || null,
  };
};

// Add medicine to cart
export const addMedicineToCart = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to add medicines to your cart",
      });
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can add medicines to their cart",
      });
    }

    const { productId, quantity = 1, variantIndex = -1 } = req.body;

    const requestedQuantity = Number(quantity);
    const selectedVariantIndex = Number(variantIndex);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine ID",
      });
    }

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    if (!Number.isInteger(selectedVariantIndex) || selectedVariantIndex < -1) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine variant",
      });
    }

    const product = await MedicineProduct.findOne({
      _id: productId,
      isDeleted: false,
      isAvailable: true,
      status: "active",
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found or unavailable",
      });
    }

    const seller = await Seller.findById(product.sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Medicine seller not found",
      });
    }

    const variantData = getVariantData(product, selectedVariantIndex);

    if (!variantData) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine variant selected",
      });
    }

    let cart = await MedicineCart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      cart = new MedicineCart({
        customer: customer._id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === productId.toString() &&
        Number(item.variantIndex ?? -1) === selectedVariantIndex,
    );

    if (existingItem) {
      existingItem.quantity += requestedQuantity;
    } else {
      cart.items.push({
        product: product._id,
        seller: product.sellerId,
        quantity: requestedQuantity,
        variantIndex: selectedVariantIndex,
      });
    }

    await cart.save();

    const totalQuantity = cart.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    return res.status(200).json({
      success: true,
      message: "Medicine added to cart successfully",
      cartCount: totalQuantity,
    });
  } catch (error) {
    console.error("Add medicine to cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add medicine to cart",
    });
  }
};

// Get medicine cart
export const getMedicineCart = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view your cart",
      });
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can view their medicine cart",
      });
    }

    const cart = await MedicineCart.findOne({
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
          totalQuantity: 0,
        },
      });
    }

    let subtotal = 0;
    let total = 0;
    let totalQuantity = 0;
    const cartItems = [];
    const validItems = [];

    for (const item of cart.items) {
      const product = item.product;

      if (
        !product ||
        product.isDeleted ||
        !product.isAvailable ||
        product.status !== "active"
      ) {
        continue;
      }

      const variantIndex = Number(item.variantIndex ?? -1);
      const variantData = getVariantData(product, variantIndex);

      if (!variantData) {
        continue;
      }

      const originalPrice = Number(variantData.price);
      const sellingPrice =
        variantData.discountPrice !== null &&
        variantData.discountPrice !== undefined
          ? Number(variantData.discountPrice)
          : originalPrice;

      const itemSubtotal = originalPrice * item.quantity;
      const itemTotal = sellingPrice * item.quantity;

      subtotal += itemSubtotal;
      total += itemTotal;
      totalQuantity += item.quantity;

      cartItems.push({
        productId: product._id,
        productName: product.productName,
        slug: product.slug,
        brand: product.brand || null,
        manufacturer: product.manufacturer || null,
        image: product.mainImage?.url || null,

        seller: product.sellerId,

        composition: product.composition || null,
        strength: product.strength || null,
        dosageForm: product.dosageForm || null,
        packSize: product.packSize || null,
        requiresPrescription: Boolean(product.requiresPrescription),

        variantIndex,
        variantLabel: variantData.label,
        variantQuantity: variantData.quantity,
        variantUnit: variantData.unit,

        quantity: item.quantity,
        originalPrice,
        sellingPrice,
        subtotal: itemTotal,
        isAvailable: product.isAvailable,
      });

      validItems.push(item);
    }

    // Remove unavailable or invalid products from the saved cart
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      cart: {
        items: cartItems,
        subtotal,
        discount: subtotal - total,
        total,
        totalItems: cartItems.length,
        totalQuantity,
      },
    });
  } catch (error) {
    console.error("Get medicine cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve medicine cart",
    });
  }
};

// Update medicine quantity in cart
export const updateMedicineCartQuantity = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to update your cart",
      });
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can update their medicine cart",
      });
    }

    const { productId, quantity, variantIndex = -1 } = req.body;

    const requestedQuantity = Number(quantity);
    const selectedVariantIndex = Number(variantIndex);

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine ID",
      });
    }

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    if (!Number.isInteger(selectedVariantIndex) || selectedVariantIndex < -1) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine variant",
      });
    }

    const cart = await MedicineCart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Medicine cart not found",
      });
    }

    const item = cart.items.find(
      (cartItem) =>
        cartItem.product.toString() === productId.toString() &&
        Number(cartItem.variantIndex ?? -1) === selectedVariantIndex,
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found in cart",
      });
    }

    item.quantity = requestedQuantity;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Medicine cart quantity updated successfully",
    });
  } catch (error) {
    console.error("Update medicine cart quantity error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update medicine quantity",
    });
  }
};

// Remove medicine from cart
export const removeMedicineCartItem = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to update your cart",
      });
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can update their medicine cart",
      });
    }

    const { productId } = req.params;
    const selectedVariantIndex = Number(req.query.variantIndex ?? -1);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine ID",
      });
    }

    if (!Number.isInteger(selectedVariantIndex) || selectedVariantIndex < -1) {
      return res.status(400).json({
        success: false,
        message: "Invalid medicine variant",
      });
    }

    const cart = await MedicineCart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Medicine cart not found",
      });
    }

    const previousLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId.toString() &&
          Number(item.variantIndex ?? -1) === selectedVariantIndex
        ),
    );

    if (cart.items.length === previousLength) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found in cart",
      });
    }

    await cart.save();

    const totalQuantity = cart.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    return res.status(200).json({
      success: true,
      message: "Medicine removed from cart successfully",
      cartCount: totalQuantity,
    });
  } catch (error) {
    console.error("Remove medicine cart item error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove medicine from cart",
    });
  }
};

// Clear medicine cart
export const clearMedicineCart = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to clear your cart",
      });
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can clear their medicine cart",
      });
    }

    const cart = await MedicineCart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Medicine cart is already empty",
      });
    }

    cart.items = [];
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Medicine cart cleared successfully",
    });
  } catch (error) {
    console.error("Clear medicine cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear medicine cart",
    });
  }
};

// Get total medicine quantity in cart
export const getMedicineCartCount = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view your cart",
      });
    }

    const customer = await Customer.findOne({
      userId: req.user._id,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }

    if (req.user.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Only customers can view their medicine cart",
      });
    }

    const cart = await MedicineCart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        count: 0,
      });
    }

    const totalQuantity = cart.items.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    return res.status(200).json({
      success: true,
      count: totalQuantity,
    });
  } catch (error) {
    console.error("Get medicine cart count error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve medicine cart count",
    });
  }
};

// controllers/mobileCartController.js

import MobileCart from "../models/MobileCart.js";
import MobileProduct from "../models/MobileProduct.js";
import Customer from "../models/Customer.js";

const getCustomer = async (userId) => {
  const customer = await Customer.findOne({
    userId,
  });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  return customer;
};

// ---------------------------------------------------------
// ADD TO MOBILE CART
// ---------------------------------------------------------

export const addToMobileCart = async (req, res) => {
  try {
    const { productId, quantity = 1, color = "" } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    const numericQuantity = Number(quantity);

    if (!Number.isInteger(numericQuantity) || numericQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1.",
      });
    }

    const customer = await getCustomer(req.user._id);

    const product = await MobileProduct.findOne({
      _id: productId,
      isDeleted: false,
      isAvailable: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Mobile product is unavailable or does not exist.",
      });
    }

    if (!product.sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller information is missing for this product.",
      });
    }

    // -------------------------------------------------------
    // VALIDATE SELECTED COLOR
    // -------------------------------------------------------

    let selectedColor = null;

    if (color?.trim()) {
      selectedColor = product.colors?.find(
        (item) =>
          item.name.trim().toLowerCase() === color.trim().toLowerCase() &&
          item.isAvailable,
      );

      if (!selectedColor) {
        return res.status(400).json({
          success: false,
          message: "Selected color is unavailable or does not exist.",
        });
      }
    }

    const normalizedColor = selectedColor?.name?.trim() || "";

    // -------------------------------------------------------
    // FIND CUSTOMER CART
    // -------------------------------------------------------

    let cart = await MobileCart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      cart = new MobileCart({
        customer: customer._id,
        items: [],
      });
    }

    // -------------------------------------------------------
    // SAME PRODUCT + SAME COLOR = SAME ITEM
    // SAME PRODUCT + DIFFERENT COLOR = DIFFERENT ITEM
    // -------------------------------------------------------

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === product._id.toString() &&
        (item.color || "").trim().toLowerCase() ===
          normalizedColor.toLowerCase(),
    );

    if (existingItem) {
      existingItem.quantity += numericQuantity;
      existingItem.addedAt = new Date();
    } else {
      cart.items.push({
        product: product._id,
        seller: product.sellerId,
        color: normalizedColor,
        quantity: numericQuantity,
        addedAt: new Date(),
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Mobile product added to cart successfully.",
      cart,
    });
  } catch (error) {
    console.error("Add to mobile cart error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to add mobile product to cart.",
    });
  }
};

// ---------------------------------------------------------
// GET MOBILE CART
// ---------------------------------------------------------

export const getMobileCart = async (req, res) => {
  try {
    const customer = await getCustomer(req.user._id);

    const cart = await MobileCart.findOne({
      customer: customer._id,
    }).populate({
      path: "items.product",
      populate: {
        path: "sellerId",
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        cart: {
          totalItems: 0,
          totalQuantity: 0,
          items: [],
          pricing: {
            subtotal: 0,
            discount: 0,
            total: 0,
          },
        },
      });
    }

    const items = [];

    let subtotal = 0;
    let discount = 0;
    let totalQuantity = 0;

    for (const cartItem of cart.items) {
      const product = cartItem.product;

      if (!product) {
        continue;
      }

      const quantity = Number(cartItem.quantity) || 1;

      // -------------------------------------------------------
      // SELECTED COLOR
      // -------------------------------------------------------

      const normalizedColor = (cartItem.color || "").trim();

      const selectedColor =
        normalizedColor && product.colors?.length
          ? product.colors.find(
              (color) =>
                color.name.trim().toLowerCase() ===
                normalizedColor.toLowerCase(),
            )
          : null;

      const hasColorPrice =
        selectedColor?.price !== null &&
        selectedColor?.price !== undefined &&
        Number(selectedColor.price) > 0;

      // -------------------------------------------------------
      // PRICE
      //
      // If color has its own price:
      //   color price becomes the selling price.
      //
      // If color price is lower than product price:
      //   product price is original price and color price
      //   gets the discount.
      //
      // If color price is higher than product price:
      //   color price is simply the current price with no
      //   discount.
      //
      // If color has no separate price:
      //   normal product discount is used.
      // -------------------------------------------------------

      let originalPrice = Number(product.price) || 0;
      let sellingPrice = originalPrice;
      let discountPrice = null;

      if (hasColorPrice) {
        const colorPrice = Number(selectedColor.price);

        if (colorPrice < originalPrice) {
          // Color-specific lower price
          sellingPrice = colorPrice;
          discountPrice = colorPrice;
        } else {
          // Color-specific price is equal/higher
          originalPrice = colorPrice;
          sellingPrice = colorPrice;
          discountPrice = null;
        }
      } else {
        const hasProductDiscount =
          product.discountPrice !== null &&
          product.discountPrice !== undefined &&
          Number(product.discountPrice) > 0 &&
          Number(product.discountPrice) < originalPrice;

        if (hasProductDiscount) {
          discountPrice = Number(product.discountPrice);
          sellingPrice = discountPrice;
        }
      }

      const itemSubtotal = sellingPrice * quantity;

      const itemDiscount = Math.max(originalPrice * quantity - itemSubtotal, 0);

      subtotal += itemSubtotal;
      discount += itemDiscount;
      totalQuantity += quantity;

      items.push({
        productId: product._id,
        productName: product.productName,
        slug: product.slug,
        brand: product.brand || "",

        image: product.mainImage?.url || "",

        seller: product.sellerId
          ? {
              _id: product.sellerId._id,
              name: product.sellerId.name || "",
            }
          : null,

        quantity,

        // ---------------------------------------------------
        // COLOR
        // ---------------------------------------------------

        color: normalizedColor,
        colorPrice: hasColorPrice ? Number(selectedColor.price) : null,

        // ---------------------------------------------------
        // VARIANT
        // ---------------------------------------------------

        variantGroupId: product.variantGroupId || "",
        variantName: product.variantName || "",
        ram: product.ram || "",
        storage: product.storage || "",

        // ---------------------------------------------------
        // PRICE
        // ---------------------------------------------------

        originalPrice,
        sellingPrice,
        discountPrice,

        subtotal: itemSubtotal,
        discount: itemDiscount,

        isAvailable:
          !product.isDeleted &&
          product.isAvailable &&
          (!selectedColor || selectedColor.isAvailable),
      });
    }

    return res.status(200).json({
      success: true,

      cart: {
        totalItems: items.length,
        totalQuantity,
        items,

        pricing: {
          subtotal,
          discount,
          total: subtotal,
        },
      },
    });
  } catch (error) {
    console.error("Get mobile cart error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to get mobile cart.",
    });
  }
};

// ---------------------------------------------------------
// UPDATE MOBILE CART QUANTITY
// ---------------------------------------------------------

export const updateMobileCartQuantity = async (req, res) => {
  try {
    const { productId, quantity, color = "" } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    const numericQuantity = Number(quantity);

    if (!Number.isInteger(numericQuantity) || numericQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1.",
      });
    }

    const customer = await getCustomer(req.user._id);

    const cart = await MobileCart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Mobile cart not found.",
      });
    }

    const normalizedColor = (color || "").trim().toLowerCase();

    // -------------------------------------------------------
    // FIND BY PRODUCT + COLOR
    // -------------------------------------------------------

    const item = cart.items.find(
      (cartItem) =>
        cartItem.product.toString() === productId.toString() &&
        (cartItem.color || "").trim().toLowerCase() === normalizedColor,
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product/color combination not found in mobile cart.",
      });
    }

    const product = await MobileProduct.findOne({
      _id: productId,
      isDeleted: false,
      isAvailable: true,
    });

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Mobile product is unavailable.",
      });
    }

    // If this cart item has a color, make sure that color
    // is still available.
    if (item.color?.trim()) {
      const selectedColor = product.colors?.find(
        (colorItem) =>
          colorItem.name.trim().toLowerCase() ===
          item.color.trim().toLowerCase(),
      );

      if (!selectedColor || !selectedColor.isAvailable) {
        return res.status(400).json({
          success: false,
          message: "Selected color is unavailable.",
        });
      }
    }

    item.quantity = numericQuantity;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Mobile cart quantity updated successfully.",
      cart,
    });
  } catch (error) {
    console.error("Update mobile cart quantity error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update mobile cart quantity.",
    });
  }
};

// ---------------------------------------------------------
// REMOVE MOBILE CART ITEM
// ---------------------------------------------------------

export const removeMobileCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    const { color = "" } = req.body || {};

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    const customer = await getCustomer(req.user._id);

    const cart = await MobileCart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Mobile cart not found.",
      });
    }

    const normalizedColor = (color || "").trim().toLowerCase();

    // -------------------------------------------------------
    // REMOVE ONLY PRODUCT + COLOR COMBINATION
    // -------------------------------------------------------

    const originalLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        !(
          item.product.toString() === productId.toString() &&
          (item.color || "").trim().toLowerCase() === normalizedColor
        ),
    );

    if (cart.items.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: "Product/color combination not found in mobile cart.",
      });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Mobile product removed from cart successfully.",
      cart,
    });
  } catch (error) {
    console.error("Remove mobile cart item error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to remove mobile cart item.",
    });
  }
};

// ---------------------------------------------------------
// CLEAR MOBILE CART
// ---------------------------------------------------------

export const clearMobileCart = async (req, res) => {
  try {
    const customer = await getCustomer(req.user._id);

    const cart = await MobileCart.findOne({
      customer: customer._id,
    });

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Mobile cart is already empty.",
      });
    }

    cart.items = [];

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Mobile cart cleared successfully.",
    });
  } catch (error) {
    console.error("Clear mobile cart error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to clear mobile cart.",
    });
  }
};

// ---------------------------------------------------------
// GET MOBILE CART COUNT
// ---------------------------------------------------------

export const getMobileCartCount = async (req, res) => {
  try {
    const customer = await getCustomer(req.user._id);

    const cart = await MobileCart.findOne({
      customer: customer._id,
    }).select("items");

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
      });
    }

    const count = cart.items.reduce(
      (total, item) => total + (Number(item.quantity) || 0),
      0,
    );

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Get mobile cart count error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to get mobile cart count.",
    });
  }
};

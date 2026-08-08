import City from "../models/City.js";
import mongoose from "mongoose";

export const createCity = async (req, res) => {
  try {
    const { name, state, deliveryCharge = 0 } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "City name is required.",
      });
    }

    if (!state?.trim()) {
      return res.status(400).json({
        success: false,
        message: "State is required.",
      });
    }

    const exists = await City.findOne({
      name: {
        $regex: `^${name.trim()}$`,
        $options: "i",
      },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "City already exists.",
      });
    }

    const city = await City.create({
      name: name.trim(),
      state: state.trim(),
      deliveryCharge,
    });

    return res.status(201).json({
      success: true,
      message: "City created successfully.",
      city,
    });
  } catch (error) {
    console.error("Create City Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create city.",
    });
  }
};

/* ==========================================================
   Get All Cities (Admin)
   GET /api/admin/cities
========================================================== */

export const getAllCities = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim() || "";

    const query = {};

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          state: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const totalCities = await City.countDocuments(query);

    const cities = await City.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,

      page,

      limit,

      totalCities,

      totalPages: Math.ceil(totalCities / limit),

      cities,
    });
  } catch (error) {
    console.error("Get Cities Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch cities.",
    });
  }
};

/* ==========================================================
   Get Active Cities
   GET /api/cities
========================================================== */

export const getActiveCities = async (req, res) => {
  try {
    const cities = await City.find({
      isActive: true,
    })
      .select("_id name state deliveryCharge")
      .sort({
        name: 1,
      });

    return res.status(200).json({
      success: true,

      totalCities: cities.length,

      cities,
    });
  } catch (error) {
    console.error("Get Active Cities Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch cities.",
    });
  }
};

/* ==========================================================
   Update City
   PUT /api/admin/cities/:id
========================================================== */

export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid city id.",
      });
    }

    const { name, state, deliveryCharge } = req.body;

    const city = await City.findById(id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found.",
      });
    }

    // Duplicate Check
    if (
      name &&
      state &&
      (name.trim().toLowerCase() !== city.name.toLowerCase() ||
        state.trim().toLowerCase() !== city.state.toLowerCase())
    ) {
      const exists = await City.findOne({
        _id: { $ne: id },
        name: {
          $regex: `^${name.trim()}$`,
          $options: "i",
        },
        state: {
          $regex: `^${state.trim()}$`,
          $options: "i",
        },
      });

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "City already exists.",
        });
      }
    }

    if (name) {
      city.name = name.trim();
    }

    if (state) {
      city.state = state.trim();
    }

    if (deliveryCharge !== undefined) {
      city.deliveryCharge = Number(deliveryCharge);
    }

    await city.save();

    return res.status(200).json({
      success: true,
      message: "City updated successfully.",
      city,
    });
  } catch (error) {
    console.error("Update City Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update city.",
    });
  }
};

/* ==========================================================
   Update City Status
   PATCH /api/admin/cities/:id/status
========================================================== */

export const updateCityStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid city id.",
      });
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    const city = await City.findById(id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found.",
      });
    }

    city.isActive = isActive;

    await city.save();

    return res.status(200).json({
      success: true,
      message: `City ${isActive ? "activated" : "deactivated"} successfully.`,
      city,
    });
  } catch (error) {
    console.error("Update City Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update city status.",
    });
  }
};

import Order from "../models/Order.js";

/* ==========================================================
   Delete City
   DELETE /api/admin/cities/:id
========================================================== */

export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid city id.",
      });
    }

    const city = await City.findById(id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found.",
      });
    }

    // Check if city is used in any order
    const usedInOrders = await Order.exists({
      "shippingAddress.city._id": city._id,
    });

    if (usedInOrders) {
      city.isActive = false;
      await city.save();

      return res.status(200).json({
        success: true,
        message:
          "City is used in existing orders, so it has been deactivated instead of deleted.",
      });
    }

    await City.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "City deleted successfully.",
    });
  } catch (error) {
    console.error("Delete City Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete city.",
    });
  }
};

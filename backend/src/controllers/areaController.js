import Area from "../models/Area.js";
import City from "../models/City.js";

// ======================================================
// ADD AREA
// POST /api/admin/areas
// ======================================================

export const createArea = async (req, res) => {
  try {
    const { name, cityId } = req.body;

    // -----------------------------
    // Validate input
    // -----------------------------
    if (!name || !cityId) {
      return res.status(400).json({
        success: false,
        message: "Area name and city are required",
      });
    }

    const trimmedName = name.trim();

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Area name cannot be empty",
      });
    }

    // -----------------------------
    // Check city
    // -----------------------------
    const city = await City.findOne({
      _id: cityId,
      isActive: true,
    });

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found or inactive",
      });
    }

    // -----------------------------
    // Check duplicate area
    // -----------------------------
    const existingArea = await Area.findOne({
      city: city._id,
      name: trimmedName,
    });

    if (existingArea) {
      return res.status(400).json({
        success: false,
        message: "Area already exists in this city",
      });
    }

    // -----------------------------
    // Create area
    // -----------------------------
    const area = await Area.create({
      name: trimmedName,
      city: city._id,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Area created successfully",
      area,
    });
  } catch (error) {
    // Handle duplicate index safely
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Area already exists in this city",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET AREAS
// GET /api/admin/areas
//
// Optional:
// GET /api/admin/areas?cityId=CITY_ID
//
// If cityId is provided, only areas of that city are returned.
// ======================================================

export const getAreas = async (req, res) => {
  try {
    const { cityId } = req.query;

    const filter = {};

    // -----------------------------
    // Filter by city when provided
    // -----------------------------
    if (cityId) {
      const city = await City.findById(cityId);

      if (!city) {
        return res.status(404).json({
          success: false,
          message: "City not found",
        });
      }

      filter.city = cityId;
    }

    const areas = await Area.find(filter)
      .populate("city", "name state")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: areas.length,
      areas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ACTIVE AREAS FOR A CITY
// GET /api/cities/:cityId/areas
// ======================================================

export const getActiveAreasByCity = async (req, res) => {
  try {
    const { cityId } = req.params;

    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: "cityId is required",
      });
    }

    const city = await City.findOne({
      _id: cityId,
      isActive: true,
    });

    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found or inactive",
      });
    }

    const areas = await Area.find({
      city: cityId,
      isActive: true,
    })
      .select("_id name city")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: areas.length,
      areas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE AREA
// PUT /api/admin/areas/:areaId
// ======================================================

export const updateArea = async (req, res) => {
  try {
    const { areaId } = req.params;
    const { name, cityId, isActive } = req.body;

    // -----------------------------
    // Find area
    // -----------------------------
    const area = await Area.findById(areaId);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }

    // -----------------------------
    // Update city if provided
    // -----------------------------
    if (cityId) {
      const city = await City.findOne({
        _id: cityId,
        isActive: true,
      });

      if (!city) {
        return res.status(404).json({
          success: false,
          message: "City not found or inactive",
        });
      }

      area.city = city._id;
    }

    // -----------------------------
    // Update name if provided
    // -----------------------------
    if (name !== undefined) {
      const trimmedName = name.trim();

      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: "Area name cannot be empty",
        });
      }

      area.name = trimmedName;
    }

    // -----------------------------
    // Update active status
    // -----------------------------
    if (isActive !== undefined) {
      area.isActive = Boolean(isActive);
    }

    // -----------------------------
    // Check duplicate
    // -----------------------------
    const duplicateArea = await Area.findOne({
      _id: { $ne: area._id },
      city: area.city,
      name: area.name,
    });

    if (duplicateArea) {
      return res.status(400).json({
        success: false,
        message: "Area already exists in this city",
      });
    }

    await area.save();

    res.status(200).json({
      success: true,
      message: "Area updated successfully",
      area,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Area already exists in this city",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DELETE / DEACTIVATE AREA
// DELETE /api/admin/areas/:areaId
// ======================================================

export const deleteArea = async (req, res) => {
  try {
    const { areaId } = req.params;

    const area = await Area.findById(areaId);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area not found",
      });
    }

    // -----------------------------
    // Soft delete
    // -----------------------------
    area.isActive = false;

    await area.save();

    res.status(200).json({
      success: true,
      message: "Area deactivated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

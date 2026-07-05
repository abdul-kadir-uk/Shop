import User from "../models/User.js";

// Get Customer Profile
export const getCustomerProfile = async (req, res) => {
  try {
    const customer = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Customer Profile
export const updateCustomerProfile = async (req, res) => {
  try {
    const { name, mobile, address } = req.body;

    const customer = await User.findById(req.user._id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    customer.name = name || customer.name;
    customer.mobile = mobile || customer.mobile;
    customer.address = address || customer.address;

    await customer.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

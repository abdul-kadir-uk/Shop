import User from "../models/User.js";
import Customer from "../models/Customer.js";

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

// ======================
// GET ALL CUSTOMERS (ADMIN)
// ======================

export const getCustomers = async (req, res) => {
  try {
    const { search } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter).select(
      "_id name email mobile isBlocked createdAt",
    );

    const userIds = users.map((user) => user._id);

    const customers = await Customer.find({
      userId: { $in: userIds },
    });

    const customerMap = new Map();

    customers.forEach((customer) => {
      customerMap.set(customer.userId.toString(), customer);
    });

    const data = users
      .map((user) => {
        const customer = customerMap.get(user._id.toString());

        if (!customer) return null;

        return {
          _id: customer._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          joined: user.createdAt,
          isBlocked: user.isBlocked,
          status: user.isBlocked ? "Blocked" : "Active",
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.joined) - new Date(a.joined));

    return res.status(200).json({
      success: true,
      count: data.length,
      customers: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// GET CUSTOMER DETAILS (ADMIN)
// ======================

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id).populate(
      "userId",
      "name email mobile role isVerified isBlocked createdAt",
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      customer: {
        _id: customer._id,
        userId: customer.userId._id,
        name: customer.userId.name,
        email: customer.userId.email,
        mobile: customer.userId.mobile,
        address: customer.address,
        role: customer.userId.role,
        isVerified: customer.userId.isVerified,
        isBlocked: customer.userId.isBlocked,
        joined: customer.userId.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// BLOCK CUSTOMER (ADMIN)
// ======================

export const blockCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const user = await User.findById(customer.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(400).json({
        success: false,
        message: "Customer is already blocked",
      });
    }

    user.isBlocked = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Customer blocked successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// UNBLOCK CUSTOMER (ADMIN)
// ======================

export const unblockCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const user = await User.findById(customer.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isBlocked) {
      return res.status(400).json({
        success: false,
        message: "Customer is already active",
      });
    }

    user.isBlocked = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Customer unblocked successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// DELETE CUSTOMER (ADMIN)
// ======================

export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Find Customer
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Delete linked User
    await User.findByIdAndDelete(customer.userId);

    // Delete Customer
    await Customer.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

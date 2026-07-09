// utils/jwt.js
import jwt from "jsonwebtoken";

// Login Token
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Password Reset Token
export const generateResetToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      purpose: "resetPassword",
      version: user.passwordResetVersion,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
};

export default generateToken;

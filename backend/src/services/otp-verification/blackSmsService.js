// services/otp-verification/blackSmsService.js

import axios from "axios";

const BLACKSMS_API_URL =
  process.env.BLACKSMS_API_URL || "https://blacksms.in/sms";

const BLACKSMS_ROUTE = process.env.BLACKSMS_ROUTE || "1";

export const sendBlackSmsOtp = async (mobile, otp) => {
  try {
    const response = await axios.post(
      BLACKSMS_API_URL,
      {
        sender_id: process.env.BLACKSMS_SENDER_ID,
        route: BLACKSMS_ROUTE,
        variables_values: otp,
        numbers: mobile,
      },
      {
        headers: {
          Authorization: process.env.BLACKSMS_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );

    return response.data;
  } catch (error) {
    console.error("BlackSMS OTP Error:", error.response?.data || error.message);

    throw new Error(
      error.response?.data?.message || "Unable to send OTP. Please try again.",
    );
  }
};

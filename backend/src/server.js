// server.js
import dotenv from "dotenv";

dotenv.config();

import connectDB from "./config/db.js";

const { default: app } = await import("./app.js");

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Render provides PORT automatically.
    // Local development falls back to 5000.
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, "0.0.0.0", () => {
      console.log(
        `🚀 Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`,
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);

    process.exit(1);
  }
};

startServer();

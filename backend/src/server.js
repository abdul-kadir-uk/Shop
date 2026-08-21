import dotenv from "dotenv";

dotenv.config();

import connectDB from "./config/db.js";

const { default: app } = await import("./app.js");

await connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
});

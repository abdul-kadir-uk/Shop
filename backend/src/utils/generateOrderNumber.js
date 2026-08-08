import Counter from "../models/Counter.js";

export const generateOrderNumber = async () => {
  const today = new Date();

  const date =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

  const counterId = `ORDER-${date}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    {
      $inc: { sequence: 1 },
    },
    {
      upsert: true,
      returnDocument: "after",
    },
  );

  return `ALF-${date}-${String(counter.sequence).padStart(6, "0")}`;
};

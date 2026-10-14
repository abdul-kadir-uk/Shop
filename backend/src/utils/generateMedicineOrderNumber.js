// src/utils/generateMedicineOrderNumber.js

import MedicineOrder from "../models/MedicineOrder.js";

export const generateMedicineOrderNumber = async () => {
  let orderNumber;
  let exists = true;

  while (exists) {
    const uniqueNumber = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

    orderNumber = `ALF-MED-ORD-${uniqueNumber}`;

    exists = await MedicineOrder.exists({ orderNumber });
  }

  return orderNumber;
};

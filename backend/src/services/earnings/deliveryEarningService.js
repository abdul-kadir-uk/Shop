import DeliveryPartner from "../../models/DeliveryPartner.js";
import DeliveryEarning from "../../models/DeliveryEarning.js";

export const createDeliveryEarning = async ({
  deliveryPartnerId,
  orderId,
  completedAt = new Date(),
}) => {
  // --------------------------------------------------
  // Check whether earning already exists
  // --------------------------------------------------

  const existingEarning = await DeliveryEarning.findOne({
    order: orderId,
  });

  if (existingEarning) {
    return existingEarning;
  }

  // --------------------------------------------------
  // Get delivery partner
  // --------------------------------------------------

  const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId);

  if (!deliveryPartner) {
    throw new Error("Delivery partner not found.");
  }

  // --------------------------------------------------
  // Get current earning rate
  // --------------------------------------------------

  const amount = Number(deliveryPartner.earningPerDelivery || 0);

  // --------------------------------------------------
  // Create earning
  // --------------------------------------------------

  const earning = await DeliveryEarning.create({
    deliveryPartner: deliveryPartnerId,
    order: orderId,
    amount,
    status: "pending",
    completedAt,
  });

  return earning;
};

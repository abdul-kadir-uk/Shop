import express from "express";
import {
  getAllGroceries,
  getSingleGrocery,
} from "../controllers/groceryController.js";

const router = express.Router();

router.get("/", getAllGroceries);
router.get("/:slug", getSingleGrocery);

export default router;

// lib/groceryApi.ts

import axios from "axios";

// Public Axios Instance
const groceryApi = axios.create({
  baseURL: "http://localhost:5000/api/groceries",
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================================
// Get All Groceries
// GET /api/groceries
// ======================================================

export const getAllGroceries = async (params = {}) => {
  const { data } = await groceryApi.get("/", {
    params,
  });

  return data;
};

// ======================================================
// Get Single Grocery
// GET /api/groceries/:slug
// ======================================================

export const getSingleGrocery = async (slug: string) => {
  const { data } = await groceryApi.get(`/${slug}`);

  return data;
};

export default groceryApi;

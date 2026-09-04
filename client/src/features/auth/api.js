import api from "../../lib/axios";

export const loginUser = async (credentials) => {
  const res = await api.post("/auth/login", credentials);
  return res.data; // expected: { user, token }
};

export const registerUser = async (userData) => {
  const res = await api.post("/auth/register", userData);
  return res.data; // expected: { user, token }
};
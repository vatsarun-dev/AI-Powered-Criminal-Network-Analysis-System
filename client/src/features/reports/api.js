import axios from "../../lib/axios";

export const getAlerts = async (params = {}) => {
  const response = await axios.get("/alerts/alert", { params });
  return response.data.data?.data ?? [];
};

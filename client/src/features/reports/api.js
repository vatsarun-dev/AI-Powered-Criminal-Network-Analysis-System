import axios from "../../lib/axios";

export const getAlerts = async () => {
  const response = await axios.get("/alerts");
  return response.data;
};
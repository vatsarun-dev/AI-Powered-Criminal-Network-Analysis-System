import axios from "../../lib/axios";

export const getEntityConnections = async (entityId) => {
  const response = await axios.get(`/graph/connections/${entityId}`);
  return response.data;
};
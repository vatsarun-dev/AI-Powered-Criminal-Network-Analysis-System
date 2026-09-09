import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const searchGraph = async (search) => {
  const response = await axios.get(
    `${API_URL}/graph/search`,
    {
      params: {
        search,
      },
    }
  );

  return response.data;
};
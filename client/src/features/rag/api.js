import api from "../../lib/axios";

export const askFirQuestion = async ({ firId, question }) => {
  const response = await api.post("/rag/ask", { firId, question });
  return response.data.data;
};

import api from "../../lib/axios";

export const queryRag = async ({ query, caseId, entityId }) => {
  const response = await api.post("/rag/query", {
    query,
    ...(caseId ? { caseId } : {}),
    ...(entityId ? { entityId } : {}),
  });

  return response.data.data;
};

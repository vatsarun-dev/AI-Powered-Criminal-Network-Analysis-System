import api from "../../lib/axios";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== "" && value !== undefined && value !== null)
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value]),
  );

const readData = (response) => response.data.data;

export const searchGraph = async (search) =>
  readData(await api.get("/graph/search", { params: { search } }));

export const getFilteredGraph = async (filters = {}) =>
  readData(await api.get("/graph/filtered", { params: cleanParams(filters) }));

export const getGraphNode = async (nodeId) =>
  readData(await api.get(`/graph/nodes/${encodeURIComponent(nodeId)}`));

export const getGraphNeighbors = async (nodeId) =>
  readData(await api.get(`/graph/nodes/${encodeURIComponent(nodeId)}/neighbors`));

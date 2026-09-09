import api from "../../lib/axios";

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value !== undefined),
  );

export const getCrimeMapOverview = async (params) => {
  const response = await api.get("/map/overview", { params: cleanParams(params) });
  return response.data.data;
};

export const getCrimeMapLocationDetails = async (groupBy, locationId, params) => {
  const collection = groupBy === "POLICE_STATION" ? "police-stations" : "districts";
  const response = await api.get(
    `/map/${collection}/${encodeURIComponent(locationId)}`,
    { params: cleanParams(params) },
  );
  return response.data.data;
};

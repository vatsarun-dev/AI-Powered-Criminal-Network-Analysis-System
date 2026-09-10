import api from "../../lib/axios";

export const getAlerts = async (params = {}) => {
  const response = await api.get("/alerts/alert", {
    params,
  });

  return response.data;
};

export const updateAlertStatus = async (alertId, status) => {
  const response = await api.patch(
    `/alerts/alert/${alertId}`,
    { status }
  );

  return response.data;
};

// FIR / Report APIs
export const getFirs = async (params = {}) => {
  const response = await api.get("/cases/firs", {
    params,
  });

  return response.data;
};

export const getFirById = async (firId) => {
  const response = await api.get(`/cases/firs/${firId}`);

  return response.data;
};

export const getFirEvidence = async (firId) => {
  const response = await api.get(
    `/cases/firs/${firId}/evidence`
  );

  return response.data;
};

export const getFirNetwork = async (firId) => {
  const response = await api.get(
    `/cases/firs/${firId}/network`
  );

  return response.data;
};
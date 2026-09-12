import api from "../../lib/axios";

export const uploadFile = async ({ file, type, caseId, onProgress }) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  formData.append("caseId", caseId);

  const response = await api.post("/uploads/file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      }
    },
  });

  return response.data.data?.data ?? response.data.data;
};

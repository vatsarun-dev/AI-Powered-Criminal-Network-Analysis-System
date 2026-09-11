import api from "../../lib/axios";

// The field names match the existing Multer controller contract.
export const uploadFile = async ({ file, type, caseId }, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  formData.append("caseId", caseId);

  const res = await api.post("/uploads/file", formData, {
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      }
    },
  });

  return res.data.data.data;
};

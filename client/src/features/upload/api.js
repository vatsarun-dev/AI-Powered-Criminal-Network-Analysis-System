import api from "../../lib/axios";

// Uploads a single file to the backend (multer expects multipart/form-data)
export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file); // "file" must match multer's field name on backend

  const res = await api.post("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percent);
      }
    },
  });

  return res.data; // expected: { fileUrl, fileName, ... } — confirm shape with backend
};
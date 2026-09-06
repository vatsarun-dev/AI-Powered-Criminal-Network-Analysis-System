import axios from "axios";

// Point this at your backend base URL.
// Create a .env file in /client with: VITE_API_BASE_URL=http://localhost:5000/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Handle expired/invalid tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authenticated");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
import { create } from "zustand";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: localStorage.getItem("authenticated") === "true",

  login: (user) => {
    localStorage.setItem("authenticated", "true");
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("authenticated");
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
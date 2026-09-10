
import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "../pages/Landing/Landing";
import Auth from "../pages/Auth/Auth";
import Dashboard from "../pages/Dashboard/Dashboard";
import Investigation from "../pages/Investigation/Investigation";
import Reports from "../pages/Reports/Reports";
import LoginForm from "../features/auth/components/LoginForm";
import RegisterForm from "../features/auth/components/RegisterForm";
import CrimeMapPage from "../pages/Map/CrimeMapPage";
import GraphPage from "../pages/Graph/GraphPage";

import ProtectedRoute from "../components/common/ProtectedRoute";

const protectedPage = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />

      <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
      <Route path="/investigation" element={protectedPage(<Investigation />)} />
      <Route path="/reports" element={protectedPage(<Reports />)} />
      <Route path="/graph" element={protectedPage(<GraphPage />)} />
      <Route path="/map" element={protectedPage(<CrimeMapPage />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


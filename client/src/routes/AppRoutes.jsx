
import { Routes, Route, Navigate } from "react-router-dom";

import Landing from "../pages/Landing/Landing";
import Auth from "../pages/Auth/Auth";
import Dashboard from "../pages/Dashboard/Dashboard";
import Investigation from "../pages/Investigation/Investigation";
import Reports from "../pages/Reports/Reports";

import ProtectedRoute from "../components/common/ProtectedRoute";
import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../components/common/ProtectedRoute";
import LoginForm from "../features/auth/components/LoginForm";
import RegisterForm from "../features/auth/components/RegisterForm";
import Dashboard from "../pages/Dashboard/Dashboard";
import Investigation from "../pages/Investigation/Investigation";
import Landing from "../pages/Landing/Landing";
import CrimeMapPage from "../pages/Map/CrimeMapPage";
import GraphPage from "../pages/Graph/GraphPage";

const protectedPage = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/investigation"
        element={
          <ProtectedRoute>
            <Investigation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* Unknown route */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
      <Route path="/investigation" element={protectedPage(<Investigation />)} />
      <Route path="/graph" element={protectedPage(<GraphPage />)} />
      <Route path="/map" element={protectedPage(<CrimeMapPage />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;


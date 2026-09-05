import { Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "../features/auth/components/LoginForm";
import RegisterForm from "../features/auth/components/RegisterForm";
import ProtectedRoute from "../components/common/ProtectedRoute";

// Placeholder until Dashboard is built
function DashboardPlaceholder() {
  return <h1>Dashboard (coming soon)</h1>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
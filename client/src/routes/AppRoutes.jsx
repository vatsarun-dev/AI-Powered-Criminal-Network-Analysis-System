import { Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing/Landing";
import Dashboard from "../pages/Dashboard/Dashboard";
import Investigation from "../pages/Investigation/Investigation";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "../features/auth/components/LoginForm";
import RegisterForm from "../features/auth/components/RegisterForm";
import ProtectedRoute from "../components/common/ProtectedRoute";
import DashboardShell from "../components/layout/DashboardShell";
import FileUpload from "../features/upload/components/FileUpload";
import GraphCanvas from "../features/graph/components/GraphCanvas";

// Placeholders — replace each with the real feature page as it's built
function DashboardHome() {
  return <h2>Dashboard Overview</h2>;
}
function GraphPage() {
  return <GraphCanvas />;
}
function TimelinePage() {
  return <h2>Timeline (coming soon)</h2>;
}
function MapPage() {
  return <h2>Map (coming soon)</h2>;
}
function AlertsPage() {
  return <h2>Alerts (coming soon)</h2>;
}
function DossierPage() {
  return <h2>Dossier Export (coming soon)</h2>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/dashboard" element={<Dashboard />} />

      <Route path="/investigation" element={<Investigation />} />
    </Routes>
  );
}

export default AppRoutes;
}

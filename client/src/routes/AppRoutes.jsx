import { Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "../features/auth/components/LoginForm";
import RegisterForm from "../features/auth/components/RegisterForm";
import ProtectedRoute from "../components/common/ProtectedRoute";
import DashboardShell from "../components/layout/DashboardShell";
import FileUpload from "../features/upload/components/FileUpload";

// Placeholders — replace each with the real feature page as it's built
function DashboardHome() {
  return <h2>Dashboard Overview</h2>;
}
function GraphPage() {
  return <h2>Graph (coming soon)</h2>;
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

// Wraps any protected page with the shared shell (Navbar + Sidebar)
function ShellRoute({ children }) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />

      <Route path="/dashboard" element={<ShellRoute><DashboardHome /></ShellRoute>} />
      <Route path="/graph" element={<ShellRoute><GraphPage /></ShellRoute>} />
      <Route path="/timeline" element={<ShellRoute><TimelinePage /></ShellRoute>} />
      <Route path="/map" element={<ShellRoute><MapPage /></ShellRoute>} />
      <Route path="/alerts" element={<ShellRoute><AlertsPage /></ShellRoute>} />
      <Route path="/dossier" element={<ShellRoute><DossierPage /></ShellRoute>} />
      <Route path="/upload" element={<ShellRoute><FileUpload /></ShellRoute>} />
    </Routes>
  );
}

















// import { Routes, Route, Navigate } from "react-router-dom";
// import LoginForm from "../features/auth/components/LoginForm";
// import RegisterForm from "../features/auth/components/RegisterForm";
// import ProtectedRoute from "../components/common/ProtectedRoute";

// // Placeholder until Dashboard is built
// function DashboardPlaceholder() {
//   return <h1>Dashboard (coming soon)</h1>;
// }

// export default function AppRoutes() {
//   return (
//     <Routes>
//       <Route path="/" element={<Navigate to="/login" replace />} />
//       <Route path="/login" element={<LoginForm />} />
//       <Route path="/register" element={<RegisterForm />} />
//       <Route
//         path="/dashboard"
//         element={
//           <ProtectedRoute>
//             <DashboardPlaceholder />
//           </ProtectedRoute>
//         }
//       />
//     </Routes>
//   );
// }
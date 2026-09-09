import { Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing/Landing";
import Dashboard from "../pages/Dashboard/Dashboard";
import Investigation from "../pages/Investigation/Investigation";

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
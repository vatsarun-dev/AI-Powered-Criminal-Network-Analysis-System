import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardShell({ children }) {
  return (
    <div className="dashboard-shell">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
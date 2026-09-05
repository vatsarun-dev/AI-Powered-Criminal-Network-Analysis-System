import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/graph", label: "Graph" },
  { to: "/timeline", label: "Timeline" },
  { to: "/map", label: "Map" },
  { to: "/alerts", label: "Alerts" },
  { to: "/dossier", label: "Dossier Export" },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <ul>
        {links.map((link) => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
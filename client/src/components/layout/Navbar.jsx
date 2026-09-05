import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-title">CrimeGraph</div>
      <div className="navbar-right">
        {user && <span className="navbar-user">{user.name}</span>}
        <button onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}
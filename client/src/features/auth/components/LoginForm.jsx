import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import useAuthStore from "../../../store/authStore";
import "../../../styles/authLogin.css";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await loginUser({ email, password });

      login(user);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">CN</div>

          <h1>Welcome back</h1>

          <p>
            Sign in to your Criminal Network Analysis System
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-primary-button"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="auth-divider">
          <span />
          <p>New here?</p>
          <span />
        </div>

        <button
          type="button"
          onClick={() => navigate("/register")}
          className="auth-secondary-button"
        >
          Create an account
        </button>

        <p className="auth-footer">
          Secure access to your network analysis dashboard
        </p>
      </div>
    </div>
  );
}

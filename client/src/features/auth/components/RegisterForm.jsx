import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api";
import useAuthStore from "../../../store/authStore";
import "../../../styles/authLogin.css";

export default function RegisterForm() {
  const [name, setName] = useState("");
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
      const { user, token } = await registerUser({
        name,
        email,
        password,
      });

      login(user, token);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">CN</div>

          <h1>Create your account</h1>

          <p>
            Join the Criminal Network Analysis System
          </p>
        </div>

        {/* Error */}
        {error && <div className="auth-error">{error}</div>}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="name">Full name</label>

            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Create a password"
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {/* Login option */}
        <div className="auth-divider">
          <span />
          <p>Already have an account?</p>
          <span />
        </div>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="auth-secondary-button"
        >
          Sign in
        </button>

        <p className="auth-footer">
          Your account gives you secure access to the analysis dashboard.
        </p>
      </div>
    </div>
  );
}

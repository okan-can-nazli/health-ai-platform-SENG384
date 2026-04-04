import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const result = await loginUser(form);
      login(result.data.accessToken);
      navigate("/dashboard");
    } catch (error) {
      setMessage(error.response?.data?.message || "Login failed.");
    }
  }

  return (
    <div className="page-container">
      <div className="card">
        <h1>Login</h1>

        <form onSubmit={handleSubmit} className="form">
          <input
            name="email"
            placeholder="Institutional Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit">Login</button>
        </form>

        {message && <p>{message}</p>}

        <p>
          Don’t have an account? <Link to="/register">Go to Register</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;

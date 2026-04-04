import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser, verifyEmail } from "../api/authApi";

function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "engineer",
    institution: "",
    expertise: "",
    city: "",
    country: ""
  });

  const [message, setMessage] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");
    setVerificationMessage("");

    try {
      const result = await registerUser(form);
      setMessage(result.message);
      setVerificationToken(result.data.demoVerificationToken);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Registration failed."
      );
    }
  }

  async function handleVerifyEmail() {
    if (!verificationToken) return;

    try {
      const result = await verifyEmail({ token: verificationToken });
      setVerificationMessage(result.message);
    } catch (error) {
      setVerificationMessage(
        error.response?.data?.message || "Verification failed."
      );
    }
  }

  return (
    <div className="page-container">
      <div className="card">
        <h1>Register</h1>

        <form onSubmit={handleRegister} className="form">
          <input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} required />
          <input name="email" placeholder="Institutional Email" value={form.email} onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />

          <select name="role" value={form.role} onChange={handleChange}>
            <option value="engineer">Engineer</option>
            <option value="healthcare_professional">Healthcare Professional</option>
          </select>

          <input name="institution" placeholder="Institution" value={form.institution} onChange={handleChange} />
          <input name="expertise" placeholder="Expertise" value={form.expertise} onChange={handleChange} />
          <input name="city" placeholder="City" value={form.city} onChange={handleChange} />
          <input name="country" placeholder="Country" value={form.country} onChange={handleChange} />

          <button type="submit">Register</button>
        </form>

        {message && <p>{message}</p>}

        {verificationToken && (
          <div className="token-box">
            <p><strong>Demo verification token:</strong></p>
            <code>{verificationToken}</code>
            <button onClick={handleVerifyEmail}>Verify Email</button>
          </div>
        )}

        {verificationMessage && <p>{verificationMessage}</p>}

        <p>
          Already have an account? <Link to="/login">Go to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;

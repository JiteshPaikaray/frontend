import { useState,useEffect } from "react";
import { loginUser } from "../services/api";

const Login = ({ onLoginSuccess }) => {
  const [form, setForm] = useState({ username: "", passwordhash: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      var res = await loginUser(form);
     // Handle successful login (e.g., redirect, show message)
     if(res!=null){
        // redirect to UserMaster page via callback from parent
        if (typeof onLoginSuccess === 'function') onLoginSuccess();
        else window.location.href = '/';
    }else{
      alert("Login failed!");
     }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="passwordhash"
            value={form.passwordhash}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
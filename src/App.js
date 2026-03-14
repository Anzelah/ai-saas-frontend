import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = "https://ai-saas-backend-f8bt.onrender.com";
const PRIMARY_BLUE = "#1e3a8a";

export default function App() {
  const [view, setView] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [history, setHistory] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [expandedRequest, setExpandedRequest] = useState(null); // store the full AI response
  const [loadingExpanded, setLoadingExpanded] = useState(false); // optional loading state

  useEffect(() => {
    if (token) {
      loadDashboard(token);
      setView("dashboard");
    }
  }, []);

  const clearAuthFields = () => {
    setEmail("");
    setPassword("");
    setNewPassword("");
    setResetToken("");
  };

  const handleError = (err) => {
    if (err.response) {
      const data = err.response.data;
  
      const message =
        data.message ||
        data.error ||
        data.msg ||
        JSON.stringify(data);
  
      setError(message);
    } else if (err.request) {
      setError("Server not responding");
    } else {
      setError(err.message);
    }
    // Automatically clear the error after 5 seconds
    setTimeout(() => {
      setError("");
    }, 5000);
  };

  const handleSuccess = (message) => {
    setSuccess(message); // show success message
    setError(""); // clear any previous errors
  
    // Automatically clear success after 5 seconds
    setTimeout(() => {
      setSuccess("");
    }, 5000);
  };

  const loadDashboard = async (jwt) => {
    try {
      const me = await axios.get(`${BACKEND_URL}/user/me`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });

      const historyRes = await axios.get(`${BACKEND_URL}/ai/history`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });

      setUser(me.data);
      setHistory(historyRes.data.data || []);
    } catch (err) {
      handleError(err);
    }
  };

  const login = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.post(`${BACKEND_URL}/auth/login`, {
        email,
        password
      });

      const jwt = res.data.token;

      setToken(jwt);
      localStorage.setItem("token", jwt);

      clearAuthFields();

      await loadDashboard(jwt);
      setView("dashboard");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    try {
      setLoading(true);
      setError("");

      await axios.post(`${BACKEND_URL}/auth/signup`, {
        email,
        password
      });

      clearAuthFields();

      handleSuccess("Account created successfully. You can now login.");
      setView("login");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async () => {
    try {
      setLoading(true);
      setError("");

      await axios.post(`${BACKEND_URL}/auth/forgot-password`, {
        email
      });

      setSuccess("Password reset token sent to your email.");
      setView("reset");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    try {
      setLoading(true);
      setError("");

      await axios.post(`${BACKEND_URL}/auth/reset-password`, {
        token: resetToken,
        newPassword
      });

      clearAuthFields();

      handleSuccess("Password reset successful. Please login.");
      setView("login");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const sendPrompt = async () => {
    try {
      setLoading(true);

      const res = await axios.post(
        `${BACKEND_URL}/ai/generate`,
        { prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResponse(res.data.response);

      const historyRes = await axios.get(`${BACKEND_URL}/ai/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setHistory(historyRes.data.data || []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  // added
  const fetchRequestById = async (id) => {
    setLoadingExpanded(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/ai/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExpandedRequest(res.data); // set full response
    } catch (err) {
      handleError(err); // show backend error
    } finally {
      setLoadingExpanded(false);
    }
  };

  const buyPlan = async (plan) => {
    try {
      const res = await axios.post(
        `${BACKEND_URL}/stripe/create-checkout-session`,
        { plan },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      window.location.href = res.data.url;
    } catch (err) {
      handleError(err);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get("stripe");
  
    if (stripeStatus === "success") {
      setSuccess("Payment successful! Your credits have been updated.");
    } else if (stripeStatus === "cancel") {
      setError("Payment canceled. No credits were added.");
    }
  
    // Remove the query string from URL so it doesn't show again on refresh
    if (stripeStatus) {
      window.history.replaceState(null, "", "/dashboard");
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setView("login");
  };

  const container = {
    maxWidth: "420px",
    margin: "120px auto",
    fontFamily: "system-ui",
    padding: "32px",
    borderRadius: "14px",
    boxShadow: "0 20px 45px rgba(0,0,0,0.08)",
    background: "white"
  };

  const input = {
    width: "100%",
    padding: "12px",
    marginTop: "12px",
    borderRadius: "6px",
    border: "1px solid #dbe3f5",
    boxSizing: "border-box"
  };

  const primaryButton = {
    width: "100%",
    padding: "12px",
    marginTop: "18px",
    borderRadius: "6px",
    border: "none",
    background: PRIMARY_BLUE,
    color: "white",
    cursor: "pointer",
    fontWeight: "600"
  };

  const successStyle = {
    color: "#16a34a",
    fontWeight: "500",
    marginBottom: "10px"
  };

  const errorStyle = {
    color: "#dc2626",
    fontWeight: "500",
    marginBottom: "10px"
  };

  const linkRow = {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "14px",
    fontSize: "14px"
  };

  const planCard = (color) => ({
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    borderTop: `4px solid ${color}`,
    background: "#f8fafc",
    textAlign: "center"
  });

  const planButton = (color) => ({
    marginTop: "10px",
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    background: color,
    color: "white",
    cursor: "pointer",
    width: "100%",
    fontWeight: "600"
  });

  // added
  {success && (
    <div
      style={{
        padding: "12px",
        marginBottom: "16px",
        backgroundColor: "#2ecc71", // green for success
        color: "white",
        borderRadius: "6px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        textAlign: "center",
      }}
    >
      {success}
    </div>
  )}

  if (view === "login") {
    return (
      <div style={container}>
        <h2 style={{ color: PRIMARY_BLUE }}>Login</h2>

        {error && <p style={errorStyle}>{error}</p>}
        {success && <p style={successStyle}>{success}</p>}

        <input
          style={input}
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />

        <div style={{ position: "relative" }}>
          <input
            style={input}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer"
            }}
          >
            {showPassword ? "🙈" : "👁"}
          </span>
        </div>

        <button style={primaryButton} onClick={login} disabled={loading}>
          {loading ? "Loading..." : "Login"}
        </button>

        <div style={linkRow}>
          <span style={{ color: PRIMARY_BLUE, cursor: "pointer" }} onClick={() => setView("forgot")}>Forgot password</span>
          <span style={{ color: PRIMARY_BLUE, cursor: "pointer" }} onClick={() => setView("register")}>Register</span>
        </div>
      </div>
    );
  }

  if (view === "register") {
    return (
      <div style={container}>
        <h2 style={{ color: PRIMARY_BLUE }}>Create Account</h2>

        {error && <p style={errorStyle}>{error}</p>}
        {success && <p style={successStyle}>{success}</p>}

        <input
          style={input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <small>
          Password must be at least 8 characters, include one uppercase and one special character.
        </small>

        <button style={primaryButton} onClick={register}>
          Create Account
        </button>

        <div style={{ marginTop: "14px", textAlign: "center" }}>
          <span style={{ color: PRIMARY_BLUE, cursor: "pointer" }} onClick={() => setView("login")}>Back to login</span>
        </div>
      </div>
    );
  }

  if (view === "forgot") {
    return (
      <div style={container}>
        <h2 style={{ color: PRIMARY_BLUE }}>Request Password Reset</h2>

        {error && <p style={errorStyle}>{error}</p>}
        {success && <p style={successStyle}>{success}</p>}

        <input
          style={input}
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button style={primaryButton} onClick={requestReset}>
          Send Reset Token
        </button>

        <div style={{ marginTop: "14px", textAlign: "center" }}>
          <span style={{ color: PRIMARY_BLUE, cursor: "pointer" }} onClick={() => setView("login")}>Back to login</span>
        </div>
      </div>
    );
  }

  if (view === "reset") {
    return (
      <div style={container}>
        <h2 style={{ color: PRIMARY_BLUE }}>Reset Password</h2>

        {error && <p style={errorStyle}>{error}</p>}
        {success && <p style={successStyle}>{success}</p>}

        <input
          style={input}
          placeholder="Reset Token"
          value={resetToken}
          onChange={(e) => setResetToken(e.target.value)}
        />

        <input
          style={input}
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <button style={primaryButton} onClick={resetPassword}>
          Reset Password
        </button>
      </div>
    );
  }

  if (view === "dashboard") {
    return (
      <div style={{ display: "flex", height: "100vh", fontFamily: "system-ui" }}>
  
        {/* Sidebar History */}
        <div
          style={{
            width: "260px",
            background: "#f8fafc",
            borderRight: "1px solid #e5e7eb",
            padding: "16px",
            overflowY: "auto"
          }}
        >
          <h3 style={{ color: PRIMARY_BLUE, marginBottom: "12px" }}>History</h3>
  
          {history.map((item, i) => (
            <div
              key={i}
              onClick={() => fetchRequestById(item.id)}
              style={{
                padding: "10px",
                marginBottom: "10px",
                background: "white",
                borderRadius: "6px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "600" }}>
                {item.prompt.slice(0, 40)}...
              </div>
  
              <div style={{ fontSize: "11px", color: "#666" }}>
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
  
        {/* Main Chat Area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "30px",
            maxWidth: "900px",
            margin: "0 auto"
          }}
        >
  
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              {user && <strong>Credits: {user.credits}</strong>}
            </div>
  
            <button
              onClick={logout}
              style={{
                border: "none",
                background: "#374151",
                color: "white",
                padding: "8px 14px",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>

          {/* Heading area */}
          <div style={{ textAlign: "center", marginTop: "30px", marginBottom: "30px" }}>
            <h2 style={{ color: PRIMARY_BLUE, marginBottom: "6px" }}>
            Generate professional business plans in seconds
            </h2>

            {user && (
              <div style={{ color: "#555", fontSize: "14px" }}>
                Credits remaining: <strong>{user.credits}</strong>
              </div>
            )}
          </div>
  
          {/* Response area */}
          <div style={{ flex: 1, marginTop: "30px", overflowY: "auto" }}>
            {response && (
              <div
                style={{
                  padding: "16px",
                  background: "#f1f5f9",
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                }}
              >
                <strong>Response</strong>
                <p>{response}</p>
              </div>
            )}
  
            {loadingExpanded && <div>Loading...</div>}
  
            {expandedRequest && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "16px",
                  background: "#e6f0ff",
                  borderRadius: "8px"
                }}
              >
                <strong>Prompt</strong>
                <p>{expandedRequest.prompt}</p>
  
                <strong>Response</strong>
                <p>{expandedRequest.response}</p>
  
                <button
                  onClick={() => setExpandedRequest(null)}
                  style={{
                    marginTop: "10px",
                    border: "none",
                    background: PRIMARY_BLUE,
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Close
                </button>
              </div>
            )}
          </div>
  
  
          {/* Prompt Input */}
          <div
            style={{
              marginTop: "20px",
              position: "relative"
            }}
          >
            <textarea
              placeholder="Ask AI something..."
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              style={{
                width: "100%",
                resize: "none",
                padding: "14px 50px 14px 14px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                fontSize: "15px",
                lineHeight: "1.4",
                minHeight: "50px",
                maxHeight: "200px",
                overflowY: "auto"
              }}
            />
  
            <button
              onClick={sendPrompt}
              style={{
                position: "absolute",
                right: "10px",
                bottom: "10px",
                border: "none",
                background: PRIMARY_BLUE,
                color: "white",
                borderRadius: "6px",
                width: "34px",
                height: "34px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              ↑
            </button>
          </div>
  
  
          {/* Plans */}
          <div style={{ marginTop: "30px" }}>
            <h3 style={{ color: PRIMARY_BLUE }}>Upgrade Plan</h3>
  
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
  
              <div style={planCard("#22c55e")}>
                <h4>Starter</h4>
                <p style={{ fontSize: "20px", fontWeight: "600" }}>$10</p>
                <p>100 Credits</p>
                <button style={planButton("#22c55e")} onClick={() => buyPlan("starter")}>
                  Buy
                </button>
              </div>
  
              <div style={planCard(PRIMARY_BLUE)}>
                <h4>Pro</h4>
                <p style={{ fontSize: "20px", fontWeight: "600" }}>$20</p>
                <p>300 Credits</p>
                <button style={planButton(PRIMARY_BLUE)} onClick={() => buyPlan("pro")}>
                  Buy
                </button>
              </div>
  
              <div style={planCard("#7c3aed")}>
                <h4>Enterprise</h4>
                <p style={{ fontSize: "20px", fontWeight: "600" }}>$50</p>
                <p>1500 Credits</p>
                <button style={planButton("#7c3aed")} onClick={() => buyPlan("enterprise")}>
                  Buy
                </button>
              </div>
  
            </div>
          </div>
  
        </div>
      </div>
    );
  }

  return null;
}

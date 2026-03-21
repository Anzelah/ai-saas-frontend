import React, { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = "https://ai-saas-backend-f8bt.onrender.com";
const PRIMARY_BLUE = "#1e3a8a";
const ACCENT = "#7c3aed";         // soft purple (elegant, not loud)
const DARK = "#111827";           // main text
const MUTED = "#6b7280";          // secondary text
const BG_LIGHT = "#f8fafc";

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

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [messages, setMessages] = useState([]);

  // ✅ Add this right here
  const passwordsMismatch = newPassword !== confirmPassword && confirmPassword.length > 0;

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
    //setResetToken("");
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

      setUser(me.data);

      const historyRes = await axios.get(`${BACKEND_URL}/ai/history`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });

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

  //Added 
  const requestReset = async () => {
    try {
      setLoading(true);
      setError("");
  
      const res = await axios.post(`${BACKEND_URL}/auth/forgot-password`, { email });
  
      // Use the demo token from backend
      setResetToken(res.data.demoResetToken || "None");

      setSuccess("Password reset token sent to your email (auto-filled for demo).");
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
        newPassword,
        confirmPassword
      });

      handleSuccess("Password reset successful. Please login.");
      setView("login");

      // Clear fields
      setNewPassword("");
      setConfirmPassword("");
      setResetToken("");
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const sendPrompt = async () => {
    if (!prompt.trim()) return; // don't send empty messages
  
    try {
      setLoading(true);
  
      // 1️⃣ Add user's message to chat
      setMessages((prev) => [...prev, { type: "user", content: prompt }]);
  
      // 2️⃣ Send prompt to backend
      const res = await axios.post(
        `${BACKEND_URL}/ai/generate`,
        { prompt },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      // 3️⃣ Add AI response to chat
      setMessages((prev) => [...prev, { type: "ai", content: res.data.response }]);
  
      // 4️⃣ Update history
      const historyRes = await axios.get(`${BACKEND_URL}/ai/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistory(historyRes.data.data || []);
  
      // 5️⃣ Clear input box
      setPrompt("");
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
  
      const data = res.data;
  
      // 🔥 Convert to chat format
      setMessages([
        { type: "user", content: data.prompt },
        { type: "ai", content: data.response },
      ]);
  
      setExpandedRequest(data); // optional (you can keep or remove later)
    } catch (err) {
      handleError(err);
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

        <div style={{ position: "relative", marginTop: "8px", width: "100%" }}>
          <input
            style={{
              ...input,
              paddingRight: "40px", // space for eye
              marginTop: 0,
              boxSizing: "border-box", // important!
            }}
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Eye toggle inside input */}
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "12px",
              top: "10%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              fontSize: "16px",
              userSelect: "none",
            }}
          >
            {showPassword ? "🙈" : "👁"}
          </span>

          {/* Password hints */}
          <small style={{ display: "block", marginTop: "6px", color: "#16a34a", lineHeight: "1.5" }}>
            Must be at least 8 characters<br />
            Must contain at least 1 uppercase letter<br />
            {"Must contain at least 1 special character: !@#$%^&*()?:{}|<></>"}
          </small>
        </div>

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
  
        {/* 🔒 Reset Token (hidden) */}
        <input
          style={input}
          type="password"
          placeholder="Reset Token"
          value={resetToken}
          onChange={(e) => setResetToken(e.target.value)}
        />
  
        {/* 🔑 New Password */}
        <div style={{ position: "relative" }}>
          <input
            style={input}
            type={showNewPassword ? "text" : "password"}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <span
            onClick={() => setShowNewPassword(!showNewPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer"
            }}
          >
            👁
          </span>
        </div>
  
        {/* 🔁 Confirm Password */}
        <div style={{ position: "relative" }}>
          <input
            style={input}
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <span
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer"
            }}
          >
            👁
          </span>
        </div>

        {passwordsMismatch && (
          <p style={{ color: "#dc2626", fontSize: "12px", marginTop: "4px" }}>
            Passwords do not match
          </p>
        )}
  
        <button
          style={primaryButton}
          onClick={resetPassword}
          disabled={passwordsMismatch || !newPassword || !confirmPassword || loading}
        >
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
          <h3 style={{ color: MUTED, marginBottom: "12px" }}>History</h3>
  
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
                {item.prompt.split(" ").slice(0, 6).join(" ")}...
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
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px"
            }}
          >
            {/* Product title */}
            <h2 style={{ color: DARK, margin: 0 }}>
            Generate a cover letter in seconds
            </h2>

            {/* Right side controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {user && (
                <span style={{ fontSize: "14px", color: "#444" }}>
                Credits:{" "}
                <span style={{ color: "ACCENT", fontWeight: "600" }}>
                  {user?.credits ?? "..."}
                </span>
              </span>
              )}

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
          </div>
  
          {/* Chat Messages + Input / New Cover Letter Button */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "16px",
              gap: "10px",
              height: "100%",
            }}
          >
            {/* Scrollable messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                paddingBottom: "10px",
              }}
            >
            {(messages || []).map((msg, i) => {
              const isLatestAI = msg.type === "ai" && i === messages.length - 1;

              return (
                <div
                  key={i}
                  style={{
                    alignSelf: msg.type === "user" ? "flex-start" : "flex-end",
                    background: msg.type === "user" ? "#e5e7eb" : PRIMARY_BLUE,
                    color: msg.type === "user" ? "#111" : "white",
                    padding: "10px 14px",
                    borderRadius: "16px",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Copy button at top of latest AI response */}
                  {isLatestAI && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "6px" }}>
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        style={{
                          border: "none",
                          background: "white",
                          color: "#1e3a8a",
                          borderRadius: "4px",
                          padding: "2px 6px",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  )}

                  {/* Actual message content */}
                  <div>{msg.content}</div>
                </div>
              );
            })}
            </div>

            {/* Input Box or New Cover Letter Button */}
            {!messages.some((m) => m.type === "ai") ? (
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <textarea
                  placeholder="Paste your job description here and get a tailored cover letter..."
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                  style={{
                    flex: 1,
                    resize: "none",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid #d1d5db",
                    fontSize: "15px",
                    lineHeight: "1.4",
                    minHeight: "50px",
                    maxHeight: "200px",
                    overflowY: "auto",
                  }}
                />
                <button
                  onClick={sendPrompt}
                  style={{
                    border: "none",
                    background: PRIMARY_BLUE,
                    color: "white",
                    borderRadius: "12px",
                    width: "48px",
                    height: "48px",
                    cursor: "pointer",
                    fontSize: "18px",
                  }}
                >
                  ↑
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMessages([]);
                  setPrompt("");
                }}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: PRIMARY_BLUE,
                  color: "white",
                  cursor: "pointer",
                  fontSize: "15px",
                }}
              >
                Generate Another Cover Letter
              </button>
            )}
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

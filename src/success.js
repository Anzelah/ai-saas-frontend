import React from "react";
import { useNavigate } from "react-router-dom";

const Success = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "70vh",
        color: "#1a3e8c", // jewel-tone blue
      }}
    >
      <h2>Payment Successful!</h2>
      <p>Your credits have been added to your account.</p>
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "16px",
          padding: "10px 20px",
          backgroundColor: "#1a3e8c",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Go to Dashboard
      </button>
    </div>
  );
};

export default Success;
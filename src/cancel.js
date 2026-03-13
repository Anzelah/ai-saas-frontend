import React from "react";
import { useNavigate } from "react-router-dom";

const Cancel = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "70vh",
        color: "#d32f2f", // red for cancel/error
      }}
    >
      <h2>Payment Cancelled</h2>
      <p>Your purchase was not completed.</p>
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
        Go Back to Dashboard
      </button>
    </div>
  );
};

export default Cancel;
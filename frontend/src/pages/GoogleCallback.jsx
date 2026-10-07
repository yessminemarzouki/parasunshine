import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { exchangeGoogleCode } from "../services/api";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const urlError = searchParams.get("error");

        if (urlError) {
          setError(decodeURIComponent(urlError));
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        if (!code) {
          setError("Données de connexion manquantes");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        const data = await exchangeGoogleCode(code);

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        const redirectTo =
          sessionStorage.getItem("redirect_after_login") || "/account";
        sessionStorage.removeItem("redirect_after_login");
        setTimeout(() => {
          navigate(redirectTo);
          window.location.reload();
        }, 1000);
      } catch (err) {
        setError(
          err?.response?.data?.message || "Erreur lors de la connexion Google",
        );
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      {error ? (
        <div style={{ textAlign: "center", maxWidth: "400px", width: "100%" }}>
          <AlertTriangle
            size={48}
            style={{ color: "#e53e3e", margin: "0 auto 20px" }}
          />
          <h2 style={{ color: "#e53e3e", marginBottom: "10px" }}>
            Erreur de connexion
          </h2>
          <p style={{ color: "#718096", marginBottom: "20px" }}>{error}</p>
          <p style={{ fontSize: "14px", color: "#a0aec0" }}>
            Redirection vers la page de connexion...
          </p>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-block",
              width: "50px",
              height: "50px",
              border: "4px solid #f3f4f6",
              borderTop: "4px solid #1a5242",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "20px",
            }}
          ></div>
          <CheckCircle2
            size={32}
            style={{ color: "#1a5242", margin: "0 auto 10px" }}
          />
          <h2 style={{ color: "#2d3748", marginBottom: "10px" }}>
            Connexion réussie !
          </h2>
          <p style={{ color: "#718096" }}>Redirection vers votre compte...</p>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default GoogleCallback;

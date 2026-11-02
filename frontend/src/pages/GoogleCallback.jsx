import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { exchangeGoogleCode } from "../services/api";

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");
        const urlError = searchParams.get("error");

        if (urlError) {
          const decoded = decodeURIComponent(urlError);
          setError(decoded);
          setTimeout(() => {
            navigate(`/login?error=${encodeURIComponent(decoded)}`);
          }, 2000);
          return;
        }

        if (!code) {
          const msg = "Données de connexion manquantes";
          setError(msg);
          setTimeout(() => {
            navigate(`/login?error=${encodeURIComponent(msg)}`);
          }, 2000);
          return;
        }

        const isNewUser = searchParams.get("new") === "1";

        const data = await exchangeGoogleCode(code);

        // Sécurité : vérifier que le backend a bien renvoyé un token et un utilisateur
        if (!data || !data.token || !data.user) {
          throw new Error("Réponse invalide du serveur. Veuillez réessayer.");
        }

        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        const redirectTo =
          sessionStorage.getItem("redirect_after_login") || "/account";

        const finalRedirect = isNewUser
          ? `${redirectTo}${redirectTo.includes("?") ? "&" : "?"}welcome=1`
          : redirectTo;

        sessionStorage.removeItem("redirect_after_login");
        setTimeout(() => {
          window.location.replace(finalRedirect);
        }, 1000);
      } catch (err) {
        const msg =
          err?.response?.data?.message || "Erreur lors de la connexion Google";
        setError(msg);
        setTimeout(() => {
          navigate(`/login?error=${encodeURIComponent(msg)}`);
        }, 3000);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

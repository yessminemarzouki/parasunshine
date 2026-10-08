import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

// ⚠️ TEMPORAIREMENT DÉSACTIVÉ POUR DEBUG — le SW cachait les nouvelles versions
//
// if (import.meta.env.PROD && "serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker.register("/sw.js").catch(() => {});
//   });
// } else if ("serviceWorker" in navigator) {
//   navigator.serviceWorker.getRegistrations().then((registrations) => {
//     registrations.forEach((registration) => registration.unregister());
//   });
// }

// Nettoyage : désenregistre tous les SW existants (même en prod pour ce test)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

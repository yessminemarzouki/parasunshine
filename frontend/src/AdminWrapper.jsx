import { lazy, Suspense, useState, useEffect } from "react";

const AdminApp = lazy(() => import("./AdminApp.jsx"));

export default function AdminWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Au build SSG (côté serveur), on ne monte pas l'admin
  // pour éviter de charger tiptap et ses dépendances.
  if (!isClient) return null;

  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Chargement...
        </div>
      }
    >
      <AdminApp />
    </Suspense>
  );
}

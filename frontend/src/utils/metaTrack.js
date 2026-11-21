import api from "../services/api";

const uuid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Envoie l'événement au Pixel ET (optionnellement) au serveur,
 * avec le MÊME event_id pour que Meta les déduplique.
 */
export function trackMeta(
  eventName,
  params = {},
  { eventId, server = false } = {},
) {
  if (typeof window === "undefined") return;
  const id = eventId || uuid();

  if (window.fbq) {
    window.fbq("track", eventName, params, { eventID: id });
  }

  if (server) {
    api
      .post("/meta/event", {
        event_name: eventName,
        event_id: id,
        source_url: window.location.href,
        custom_data: params,
      })
      .catch(() => {});
  }
  return id;
}

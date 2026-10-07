const KEY = "checkout_redirect_after_login";
const TTL_MS = 30 * 60 * 1000; // expire après 30 min pour éviter toute redirection fantôme

export const setPostLoginRedirect = (path) =>
  localStorage.setItem(KEY, JSON.stringify({ path, at: Date.now() }));

export const peekPostLoginRedirect = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { path, at } = JSON.parse(raw);
    if (!path || Date.now() - at > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return path;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
};

export const clearPostLoginRedirect = () => localStorage.removeItem(KEY);

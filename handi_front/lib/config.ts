const DEFAULT_LOCAL_API_PORT = "4000";

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function buildLocalApiOrigin() {
  if (typeof window === "undefined") {
    return `http://localhost:${DEFAULT_LOCAL_API_PORT}`;
  }

  return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_LOCAL_API_PORT}`;
}

function isLocalFrontendOrigin(url: URL) {
  return ["localhost", "127.0.0.1"].includes(url.hostname) && ["3000", "3001"].includes(url.port);
}

export const API_AUTH_URL = process.env.NEXT_PUBLIC_API_AUTH_URL?.trim() || buildLocalApiOrigin();

export function construireUrlApi(chemin: string) {
  const normalizedPath = normalizePath(chemin);

  try {
    const configured = new URL(API_AUTH_URL, typeof window !== "undefined" ? window.location.origin : undefined);

    if (typeof window !== "undefined") {
      const current = new URL(window.location.origin);

      if (isLocalFrontendOrigin(current) && isLocalFrontendOrigin(configured)) {
        return `${buildLocalApiOrigin()}${normalizedPath}`;
      }
    }

    return `${configured.origin}${normalizedPath}`;
  } catch {
    return `${buildLocalApiOrigin()}${normalizedPath}`;
  }
}

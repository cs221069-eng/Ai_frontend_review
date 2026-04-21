const DEFAULT_API_BASE = "https://ai-backend-review.vercel.app/api";

const normalizeApiBaseUrl = (value) => {
  if (!value || typeof value !== "string") {
    return DEFAULT_API_BASE;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return DEFAULT_API_BASE;
  }

  const withProtocol = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const url = new URL(withProtocol);
    const normalizedPath = url.pathname === "/" ? "/api" : url.pathname;

    return `${url.origin}${normalizedPath.replace(/\/$/, "")}`;
  } catch {
    return DEFAULT_API_BASE;
  }
};

export const API_BASE = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

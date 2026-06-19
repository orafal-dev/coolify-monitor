import type { CoolifyHealth, CoolifyVersion } from "@/lib/coolify/types";

export const parseResponseBody = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text.trim()) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const looksLikeJson =
    contentType.includes("application/json") ||
    text.trimStart().startsWith("{") ||
    text.trimStart().startsWith("[");

  if (looksLikeJson) {
    return JSON.parse(text) as T;
  }

  return text as T;
};

export const parseCoolifyVersion = (data: unknown): string | undefined => {
  if (typeof data === "string") {
    const trimmed = data.trim();
    return trimmed || undefined;
  }

  if (data && typeof data === "object" && "version" in data) {
    const version = (data as CoolifyVersion).version;
    return typeof version === "string" && version.trim() ? version.trim() : undefined;
  }

  return undefined;
};

export const parseCoolifyHealth = (data: unknown): CoolifyHealth | undefined => {
  if (typeof data === "string") {
    const status = data.trim();
    return status ? { status } : undefined;
  }

  if (data && typeof data === "object") {
    return data as CoolifyHealth;
  }

  return undefined;
};

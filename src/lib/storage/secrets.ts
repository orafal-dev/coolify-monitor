"use client";

import { invoke } from "@tauri-apps/api/core";

const TOKEN_PREFIX = "coolify-dev-token:";

const isTauriRuntime = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

// Avoid repeated keychain reads within a single app session (HMR, remounts, etc.).
const tokenCache = new Map<string, string>();

const cacheToken = (instanceId: string, token: string): void => {
  tokenCache.set(instanceId, token);
};

const readCachedToken = (instanceId: string): string | null =>
  tokenCache.get(instanceId) ?? null;

const formatSecretError = (action: string, error: unknown): string => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown keychain error";

  return `Failed to ${action} API token in secure storage: ${message}`;
};
export const saveInstanceToken = async (
  instanceId: string,
  token: string,
): Promise<void> => {
  const normalized = token.trim();
  if (!normalized) {
    return;
  }

  if (readCachedToken(instanceId) === normalized) {
    return;
  }

  if (isTauriRuntime()) {
    try {
      await invoke("save_instance_token", { instanceId, token: normalized });
      cacheToken(instanceId, normalized);
    } catch (error) {
      throw new Error(formatSecretError("save", error));
    }
    return;
  }

  sessionStorage.setItem(`${TOKEN_PREFIX}${instanceId}`, normalized);
  cacheToken(instanceId, normalized);
};

export const getInstanceToken = async (
  instanceId: string,
): Promise<string | null> => {
  const cached = readCachedToken(instanceId);
  if (cached) {
    return cached;
  }

  if (isTauriRuntime()) {
    try {
      const token = await invoke<string>("get_instance_token", { instanceId });
      const normalized = token.trim();
      if (!normalized) {
        return null;
      }

      cacheToken(instanceId, normalized);
      return normalized;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error ?? "Unknown error");

      if (message.toLowerCase().includes("no entry")) {
        return null;
      }

      console.error("Failed to read API token from keychain:", message);
      return null;
    }
  }

  const token = sessionStorage.getItem(`${TOKEN_PREFIX}${instanceId}`);
  if (token?.trim()) {
    cacheToken(instanceId, token.trim());
    return token.trim();
  }

  return null;
};

export const deleteInstanceToken = async (instanceId: string): Promise<void> => {
  tokenCache.delete(instanceId);

  if (isTauriRuntime()) {
    try {
      await invoke("delete_instance_token", { instanceId });
    } catch {
      // Ignore missing credentials during cleanup.
    }
    return;
  }

  sessionStorage.removeItem(`${TOKEN_PREFIX}${instanceId}`);
};

export const hasInstanceToken = async (instanceId: string): Promise<boolean> => {
  if (isTauriRuntime()) {
    try {
      return await invoke<boolean>("has_instance_token", { instanceId });
    } catch {
      return false;
    }
  }

  return Boolean(sessionStorage.getItem(`${TOKEN_PREFIX}${instanceId}`));
};

export const usesNativeSecretStorage = (): boolean => isTauriRuntime();

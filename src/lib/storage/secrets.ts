import { invoke } from "@tauri-apps/api/core";

const TOKEN_PREFIX = "coolify-dev-token:";

const isTauriRuntime = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const saveInstanceToken = async (
  instanceId: string,
  token: string,
): Promise<void> => {
  if (!token.trim()) {
    return;
  }

  if (isTauriRuntime()) {
    await invoke("save_instance_token", { instanceId, token });
    return;
  }

  sessionStorage.setItem(`${TOKEN_PREFIX}${instanceId}`, token);
};

export const getInstanceToken = async (
  instanceId: string,
): Promise<string | null> => {
  if (isTauriRuntime()) {
    try {
      const token = await invoke<string>("get_instance_token", { instanceId });
      return token.trim() ? token : null;
    } catch {
      return null;
    }
  }

  return sessionStorage.getItem(`${TOKEN_PREFIX}${instanceId}`);
};

export const deleteInstanceToken = async (instanceId: string): Promise<void> => {
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

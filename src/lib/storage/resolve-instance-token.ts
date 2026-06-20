import type { CoolifyInstance } from "@/lib/coolify/constants";
import { getInstanceToken } from "@/lib/storage/secrets";

export const resolveInstanceWithToken = async (
  instance: CoolifyInstance,
): Promise<CoolifyInstance | null> => {
  const inMemoryToken = instance.apiToken.trim();
  if (inMemoryToken) {
    return instance;
  }

  const storedToken = (await getInstanceToken(instance.id))?.trim();
  if (!storedToken) {
    return null;
  }

  return {
    ...instance,
    apiToken: storedToken,
  };
};

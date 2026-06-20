"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchOverview, validateConnection } from "@/lib/coolify/client";
import type { CoolifyInstance } from "@/lib/coolify/constants";
import { resolveInstanceWithToken } from "@/lib/storage/resolve-instance-token";

export const coolifyQueryKeys = {
  overview: (instance: CoolifyInstance, tokenMarker: string) =>
    [
      "coolify-overview",
      instance.id,
      instance.baseUrl,
      tokenMarker,
    ] as const,
  validate: (instance: CoolifyInstance, tokenMarker: string) =>
    [
      "coolify-validate",
      instance.id,
      instance.baseUrl,
      tokenMarker,
    ] as const,
};

export const useCoolifyOverview = (
  instance: CoolifyInstance | null,
  enabled: boolean,
) => {
  const tokenMarker =
    instance?.apiToken.trim().slice(0, 8) || (enabled ? "stored" : "none");

  return useQuery({
    queryKey: instance
      ? coolifyQueryKeys.overview(instance, tokenMarker)
      : ["coolify-overview", "none"],
    queryFn: async () => {
      const resolved = await resolveInstanceWithToken(instance!);
      if (!resolved) {
        throw {
          message:
            "No API token found for this instance. Re-enter your token in Settings.",
          status: 401,
        };
      }

      return fetchOverview(resolved);
    },
    enabled: enabled && Boolean(instance),
    refetchInterval: enabled && instance
      ? instance.refreshIntervalSeconds * 1000
      : false,
    staleTime: 10_000,
    retry: 1,
  });
};

export const useValidateConnection = (
  instance: CoolifyInstance,
  enabled: boolean,
) => {
  const tokenMarker = instance.apiToken.trim().slice(0, 8) || "stored";

  return useQuery({
    queryKey: coolifyQueryKeys.validate(instance, tokenMarker),
    queryFn: async () => {
      const resolved = await resolveInstanceWithToken(instance);
      if (!resolved) {
        throw {
          message: "Enter an API token to test the connection.",
          status: 401,
        };
      }

      return validateConnection(resolved);
    },
    enabled,
    retry: false,
    staleTime: 0,
  });
};

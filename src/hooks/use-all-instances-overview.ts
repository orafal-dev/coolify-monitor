"use client";

import { keepPreviousData, useQueries } from "@tanstack/react-query";
import { fetchOverview } from "@/lib/coolify/client";
import type { CoolifyInstance } from "@/lib/coolify/constants";
import { coolifyQueryKeys } from "@/hooks/use-coolify";
import { resolveInstanceWithToken } from "@/lib/storage/resolve-instance-token";
import type { CoolifyOverview } from "@/lib/coolify/types";

const getTokenMarker = (instance: CoolifyInstance, hasStoredToken: boolean): string =>
  instance.apiToken.trim().slice(0, 8) || (hasStoredToken ? "stored" : "none");

const isInstanceConfigured = (
  instance: CoolifyInstance,
  instanceHasStoredToken: (id: string) => boolean,
): boolean =>
  Boolean(instance.apiToken.trim()) || instanceHasStoredToken(instance.id);

export type InstanceOverviewResult = {
  instance: CoolifyInstance;
  data: CoolifyOverview | undefined;
  dataUpdatedAt: number;
  isSuccess: boolean;
};

export const useAllInstancesOverview = (
  instances: CoolifyInstance[],
  instanceHasStoredToken: (id: string) => boolean,
  enabled: boolean,
) => {
  const queries = useQueries({
    queries: instances.map((instance) => {
      const configured = isInstanceConfigured(instance, instanceHasStoredToken);
      const tokenMarker = getTokenMarker(instance, instanceHasStoredToken(instance.id));

      return {
        queryKey: coolifyQueryKeys.overview(instance, tokenMarker),
        queryFn: async () => {
          const resolved = await resolveInstanceWithToken(instance);
          if (!resolved) {
            throw {
              message:
                "No API token found for this instance. Re-enter your token in Settings.",
              status: 401,
            };
          }

          return fetchOverview(resolved);
        },
        enabled: enabled && configured,
        refetchInterval: configured
          ? instance.refreshIntervalSeconds * 1000
          : false,
        staleTime: 10_000,
        retry: 1,
        placeholderData: keepPreviousData,
      };
    }),
  });

  const overviews: InstanceOverviewResult[] = instances.map((instance, index) => {
    const query = queries[index];

    return {
      instance,
      data: query.data,
      dataUpdatedAt: query.dataUpdatedAt,
      isSuccess: query.isSuccess,
    };
  });

  return { overviews };
};

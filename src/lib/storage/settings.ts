import { LazyStore } from "@tauri-apps/plugin-store";
import {
  buildDefaultInstanceLabel,
  getDefaultInstance,
  INSTANCES_STORE_KEY,
  SETTINGS_STORE_PATH,
  stripToken,
  type CoolifyInstance,
  type HydratedInstancesState,
  type InstancesState,
  type StoredCoolifyInstance,
} from "@/lib/coolify/constants";
import {
  deleteInstanceToken,
  getInstanceToken,
  saveInstanceToken,
} from "@/lib/storage/secrets";

const LEGACY_CONNECTION_KEY = "connection";

const EMPTY_STATE: HydratedInstancesState = {
  instances: [],
  activeInstanceId: null,
};

const isTauriRuntime = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let storePromise: Promise<LazyStore> | null = null;

const getStore = async (): Promise<LazyStore> => {
  if (!storePromise) {
    storePromise = (async () => {
      const store = new LazyStore(SETTINGS_STORE_PATH);
      await store.init();
      return store;
    })();
  }

  return storePromise;
};

type LegacyStoredInstance = StoredCoolifyInstance & { apiToken?: string };

type LegacyInstancesPayload = {
  instances: LegacyStoredInstance[];
  activeInstanceId: string | null;
};

const hydrateInstances = async (
  storedInstances: LegacyStoredInstance[],
): Promise<CoolifyInstance[]> =>
  Promise.all(
    storedInstances.map(async (instance) => {
      const tokenFromStore = instance.apiToken?.trim() ?? "";
      const tokenFromKeychain =
        (await getInstanceToken(instance.id))?.trim() ?? "";
      const apiToken = tokenFromKeychain || tokenFromStore;

      if (tokenFromStore && !tokenFromKeychain) {
        await saveInstanceToken(instance.id, tokenFromStore);
      }

      return {
        id: instance.id,
        label: instance.label,
        baseUrl: instance.baseUrl,
        instanceType: instance.instanceType,
        refreshIntervalSeconds: instance.refreshIntervalSeconds,
        apiToken,
      };
    }),
  );

const readFromLocalStorage = async (): Promise<HydratedInstancesState> => {
  if (typeof window === "undefined") {
    return EMPTY_STATE;
  }

  const raw = window.localStorage.getItem(INSTANCES_STORE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as LegacyInstancesPayload;
      const instances = await hydrateInstances(parsed.instances ?? []);
      return {
        instances,
        activeInstanceId: parsed.activeInstanceId,
      };
    } catch {
      return EMPTY_STATE;
    }
  }

  const legacyRaw = window.localStorage.getItem(LEGACY_CONNECTION_KEY);
  if (!legacyRaw) {
    return EMPTY_STATE;
  }

  try {
    const legacy = JSON.parse(legacyRaw) as Omit<CoolifyInstance, "id"> & {
      id?: string;
      apiToken?: string;
    };

    if (!legacy.apiToken?.trim()) {
      return EMPTY_STATE;
    }

    const instance = getDefaultInstance({
      ...legacy,
      id: legacy.id ?? crypto.randomUUID(),
      label:
        legacy.label?.trim() ||
        buildDefaultInstanceLabel(legacy.instanceType ?? "cloud", []),
    });

    await saveInstanceToken(instance.id, legacy.apiToken);

    return {
      instances: [{ ...instance, apiToken: legacy.apiToken }],
      activeInstanceId: instance.id,
    };
  } catch {
    return EMPTY_STATE;
  }
};

const writeToLocalStorage = (state: InstancesState): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(INSTANCES_STORE_KEY, JSON.stringify(state));
  window.localStorage.removeItem(LEGACY_CONNECTION_KEY);
};

const migrateLegacyStore = async (
  store: LazyStore,
): Promise<HydratedInstancesState | null> => {
  const legacy = await store.get<Omit<CoolifyInstance, "id"> & { id?: string }>(
    LEGACY_CONNECTION_KEY,
  );

  if (!legacy?.apiToken?.trim()) {
    return null;
  }

  const instance = getDefaultInstance({
    ...legacy,
    id: legacy.id ?? crypto.randomUUID(),
    label:
      legacy.label?.trim() ||
      buildDefaultInstanceLabel(legacy.instanceType ?? "cloud", []),
  });

  await saveInstanceToken(instance.id, legacy.apiToken);

  const migrated: InstancesState = {
    instances: [stripToken(instance)],
    activeInstanceId: instance.id,
  };

  await store.set(INSTANCES_STORE_KEY, migrated);
  await store.delete(LEGACY_CONNECTION_KEY);
  await store.save();

  return {
    instances: [{ ...instance, apiToken: legacy.apiToken }],
    activeInstanceId: instance.id,
  };
};

const migrateEmbeddedTokens = async (
  payload: LegacyInstancesPayload,
): Promise<InstancesState> => {
  const nextInstances: StoredCoolifyInstance[] = [];

  for (const instance of payload.instances ?? []) {
    const tokenFromStore = instance.apiToken?.trim() ?? "";
    if (tokenFromStore) {
      await saveInstanceToken(instance.id, tokenFromStore);
    }

    nextInstances.push({
      id: instance.id,
      label: instance.label,
      baseUrl: instance.baseUrl,
      instanceType: instance.instanceType,
      refreshIntervalSeconds: instance.refreshIntervalSeconds,
    });
  }

  return {
    instances: nextInstances,
    activeInstanceId: payload.activeInstanceId,
  };
};

export const loadInstancesState = async (): Promise<HydratedInstancesState> => {
  if (!isTauriRuntime()) {
    return readFromLocalStorage();
  }

  const store = await getStore();
  const saved = await store.get<LegacyInstancesPayload>(INSTANCES_STORE_KEY);

  if (saved?.instances?.length) {
    const hasEmbeddedTokens = saved.instances.some(
      (instance) => Boolean(instance.apiToken?.trim()),
    );

    let instancesToHydrate = saved.instances;

    if (hasEmbeddedTokens) {
      const migrated = await migrateEmbeddedTokens(saved);
      await store.set(INSTANCES_STORE_KEY, migrated);
      await store.save();
      instancesToHydrate = migrated.instances;
    }

    return {
      instances: await hydrateInstances(instancesToHydrate),
      activeInstanceId: saved.activeInstanceId,
    };
  }

  const migrated = await migrateLegacyStore(store);
  return migrated ?? EMPTY_STATE;
};

export const saveInstancesState = async (
  state: HydratedInstancesState,
): Promise<void> => {
  for (const instance of state.instances) {
    if (instance.apiToken.trim()) {
      await saveInstanceToken(instance.id, instance.apiToken.trim());
    }
  }

  const persisted: InstancesState = {
    instances: state.instances.map(stripToken),
    activeInstanceId: state.activeInstanceId,
  };

  if (!isTauriRuntime()) {
    writeToLocalStorage(persisted);
    return;
  }

  const store = await getStore();
  await store.set(INSTANCES_STORE_KEY, persisted);
  await store.save();
};

export const removeInstanceFromStorage = async (
  instanceId: string,
): Promise<void> => {
  await deleteInstanceToken(instanceId);
};

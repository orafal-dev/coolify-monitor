"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type AppView,
  type CoolifyInstance,
  type HydratedInstancesState,
} from "@/lib/coolify/constants";
import {
  loadInstancesState,
  removeInstanceFromStorage,
  saveInstancesState,
} from "@/lib/storage/settings";

type AppContextValue = {
  instances: CoolifyInstance[];
  activeInstance: CoolifyInstance | null;
  isConfigured: boolean;
  needsSetup: boolean;
  isHydrated: boolean;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  switchInstance: (instanceId: string) => void;
  addInstance: (instance: CoolifyInstance) => Promise<void>;
  updateInstance: (instance: CoolifyInstance) => Promise<void>;
  removeInstance: (instanceId: string) => Promise<void>;
  startCreateInstance: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const getActiveInstance = (
  state: HydratedInstancesState,
): CoolifyInstance | null => {
  if (!state.instances.length) {
    return null;
  }

  const active =
    state.instances.find((instance) => instance.id === state.activeInstanceId) ??
    state.instances[0];

  return active ?? null;
};

const persistState = async (state: HydratedInstancesState): Promise<void> => {
  await saveInstancesState(state);
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [instancesState, setInstancesState] = useState<HydratedInstancesState>({
    instances: [],
    activeInstanceId: null,
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeView, setActiveView] = useState<AppView>("overview");

  useEffect(() => {
    const hydrate = async () => {
      const saved = await loadInstancesState();
      setInstancesState(saved);
      setIsHydrated(true);
    };

    void hydrate();
  }, []);

  const activeInstance = useMemo(
    () => getActiveInstance(instancesState),
    [instancesState],
  );

  const switchInstance = useCallback((instanceId: string) => {
    setInstancesState((current) => {
      const exists = current.instances.some((instance) => instance.id === instanceId);
      if (!exists) {
        return current;
      }

      const next = { ...current, activeInstanceId: instanceId };
      void persistState(next);
      return next;
    });
    setActiveView("overview");
  }, []);

  const addInstance = useCallback(async (instance: CoolifyInstance) => {
    const next: HydratedInstancesState = {
      instances: [...instancesState.instances, instance],
      activeInstanceId: instance.id,
    };

    await persistState(next);
    setInstancesState(next);
    setActiveView("overview");
  }, [instancesState.instances]);

  const updateInstance = useCallback(async (instance: CoolifyInstance) => {
    const next: HydratedInstancesState = {
      instances: instancesState.instances.map((item) =>
        item.id === instance.id ? instance : item,
      ),
      activeInstanceId: instance.id,
    };

    await persistState(next);
    setInstancesState(next);
    setActiveView("overview");
  }, [instancesState.instances]);

  const removeInstance = useCallback(async (instanceId: string) => {
    await removeInstanceFromStorage(instanceId);

    const remaining = instancesState.instances.filter(
      (instance) => instance.id !== instanceId,
    );

    const nextActiveId =
      instancesState.activeInstanceId === instanceId
        ? (remaining[0]?.id ?? null)
        : instancesState.activeInstanceId;

    const next: HydratedInstancesState = {
      instances: remaining,
      activeInstanceId: nextActiveId,
    };

    await persistState(next);
    setInstancesState(next);
    setActiveView(remaining.length ? "overview" : "overview");
  }, [instancesState.activeInstanceId, instancesState.instances]);

  const startCreateInstance = useCallback(() => {
    setActiveView("create-instance");
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      instances: instancesState.instances,
      activeInstance,
      isConfigured: Boolean(activeInstance?.apiToken.trim()),
      needsSetup: instancesState.instances.length === 0,
      isHydrated,
      activeView,
      setActiveView,
      switchInstance,
      addInstance,
      updateInstance,
      removeInstance,
      startCreateInstance,
    }),
    [
      activeInstance,
      activeView,
      addInstance,
      instancesState.instances,
      isHydrated,
      removeInstance,
      startCreateInstance,
      switchInstance,
      updateInstance,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider.");
  }

  return context;
};

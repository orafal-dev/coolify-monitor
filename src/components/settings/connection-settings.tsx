"use client";

import { useEffect, useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CloudIcon,
  Link01Icon,
  Moon02Icon,
  Sun03Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardPanel, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  buildDefaultInstanceLabel,
  COOLIFY_CLOUD_BASE_URL,
  DEFAULT_REFRESH_INTERVAL_SECONDS,
  normalizeBaseUrl,
  type CoolifyInstance,
  type InstanceType,
  type StoredCoolifyInstance,
} from "@/lib/coolify/constants";
import { validateConnection } from "@/lib/coolify/client";
import type { CoolifyApiError } from "@/lib/coolify/types";
import { getInstanceToken, usesNativeSecretStorage } from "@/lib/storage/secrets";

type ConnectionSettingsMode = "splash" | "create" | "edit";

type ConnectionSettingsProps = {
  instance: CoolifyInstance;
  mode: ConnectionSettingsMode;
  existingInstances?: StoredCoolifyInstance[];
  hasStoredToken?: boolean;
  onSave: (instance: CoolifyInstance) => Promise<void>;
  onRemove?: () => Promise<void>;
};

export const ConnectionSettings = ({
  instance,
  mode,
  existingInstances = [],
  hasStoredToken = false,
  onSave,
  onRemove,
}: ConnectionSettingsProps) => {
  const { theme, setTheme } = useTheme();
  const [draft, setDraft] = useState<CoolifyInstance>(instance);
  const [isLabelCustomized, setIsLabelCustomized] = useState(mode === "edit");
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isCloud = draft.instanceType === "cloud";
  const isSplash = mode === "splash";
  const isCreate = mode === "create";
  const isEdit = mode === "edit";

  const namingPool = useMemo(
    () =>
      isCreate
        ? existingInstances
        : existingInstances.filter((item) => item.id !== draft.id),
    [draft.id, existingInstances, isCreate],
  );

  useEffect(() => {
    setDraft(instance);
    setIsLabelCustomized(mode === "edit");
  }, [instance, mode]);

  const previewUrl = useMemo(
    () => normalizeBaseUrl(isCloud ? COOLIFY_CLOUD_BASE_URL : draft.baseUrl),
    [draft.baseUrl, isCloud],
  );

  const handleInstanceTypeChange = (value: InstanceType) => {
    setDraft((current) => ({
      ...current,
      instanceType: value,
      baseUrl:
        value === "cloud" ? COOLIFY_CLOUD_BASE_URL : current.baseUrl || "",
      label: isLabelCustomized
        ? current.label
        : buildDefaultInstanceLabel(value, namingPool),
    }));
  };

  const resolveApiToken = async (): Promise<string | null> => {
    const entered = draft.apiToken.trim();
    if (entered) {
      return entered;
    }

    if (isEdit || hasStoredToken) {
      return getInstanceToken(draft.id);
    }

    return null;
  };

  const buildPayload = async (): Promise<CoolifyInstance | null> => {
    const apiToken = await resolveApiToken();
    if (!apiToken) {
      return null;
    }

    const label =
      draft.label.trim() ||
      buildDefaultInstanceLabel(draft.instanceType, namingPool);

    return {
      ...draft,
      label,
      apiToken,
      baseUrl: previewUrl,
      refreshIntervalSeconds:
        draft.refreshIntervalSeconds || DEFAULT_REFRESH_INTERVAL_SECONDS,
    };
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setFeedback(null);

    try {
      const payload = await buildPayload();
      if (!payload) {
        setFeedback({
          type: "error",
          message: "Enter an API token to test the connection.",
        });
        return;
      }

      const result = await validateConnection(payload);
      setFeedback({
        type: "success",
        message: `Connected successfully${result.version ? ` · ${result.version}` : ""}.`,
      });
    } catch (error) {
      const apiError = error as CoolifyApiError;
      setFeedback({
        type: "error",
        message: apiError.message ?? "Unable to connect to Coolify.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    try {
      const payload = await buildPayload();
      if (!payload) {
        setFeedback({
          type: "error",
          message: "Enter an API token before saving this instance.",
        });
        return;
      }

      await onSave(payload);
      setFeedback({
        type: "success",
        message: isCreate
          ? "Instance added. Monitoring started."
          : "Instance saved. Monitoring updated.",
      });
    } catch (error) {
      const apiError = error as CoolifyApiError;
      setFeedback({
        type: "error",
        message: apiError.message ?? "Failed to save instance.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tokenHelpText = usesNativeSecretStorage()
    ? "Create a bearer token in Coolify under Keys & Tokens. It is stored securely in your device keychain."
    : "Create a bearer token in Coolify under Keys & Tokens. Browser dev mode stores it in session storage only.";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>
            {isSplash
              ? "Connect Coolify"
              : isCreate
                ? "Add Coolify instance"
                : "Instance settings"}
          </CardTitle>
        </CardHeader>
        <CardPanel className="space-y-6">
          <Field>
            <FieldLabel htmlFor="instance-label">Instance name</FieldLabel>
            <Input
              id="instance-label"
              value={draft.label}
              onChange={(event) => {
                setIsLabelCustomized(true);
                setDraft((current) => ({
                  ...current,
                  label: event.target.value,
                }));
              }}
              placeholder={buildDefaultInstanceLabel(
                draft.instanceType,
                namingPool,
              )}
            />
            <FieldDescription>
              Choose any name you like. Defaults to{" "}
              {buildDefaultInstanceLabel(draft.instanceType, namingPool)}.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="instance-type">Instance type</FieldLabel>
            <Select
              value={draft.instanceType}
              onValueChange={(value) =>
                handleInstanceTypeChange(value as InstanceType)
              }
            >
              <SelectTrigger id="instance-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectPopup>
                <SelectItem value="cloud">Coolify Cloud</SelectItem>
                <SelectItem value="self-hosted">Self-hosted</SelectItem>
              </SelectPopup>
            </Select>
            <FieldDescription>
              Cloud uses {COOLIFY_CLOUD_BASE_URL}. Self-hosted accepts your own
              Coolify URL.
            </FieldDescription>
          </Field>

          {!isCloud ? (
            <Field>
              <FieldLabel htmlFor="base-url">API base URL</FieldLabel>
              <Input
                id="base-url"
                value={draft.baseUrl}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    baseUrl: event.target.value,
                  }))
                }
                placeholder="https://coolify.example.com"
              />
              <FieldDescription>
                Requests are sent to{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  {previewUrl}/api/v1
                </code>
              </FieldDescription>
            </Field>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
              <HugeiconsIcon icon={CloudIcon} className="size-5 text-sky-500" strokeWidth={2} />
              <div>
                <p className="font-medium">Coolify Cloud endpoint</p>
                <p className="text-muted-foreground">{previewUrl}/api/v1</p>
              </div>
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="api-token">API token</FieldLabel>
            <Input
              id="api-token"
              type="password"
              value={draft.apiToken}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  apiToken: event.target.value,
                }))
              }
              placeholder={
                isEdit && hasStoredToken
                  ? "Leave blank to keep the saved token"
                  : "Paste token from Keys & Tokens"
              }
            />
            <FieldDescription>{tokenHelpText}</FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="refresh-interval">
              Refresh interval (seconds)
            </FieldLabel>
            <Input
              id="refresh-interval"
              type="number"
              min={10}
              max={300}
              value={draft.refreshIntervalSeconds}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  refreshIntervalSeconds: Number(event.target.value) || 30,
                }))
              }
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting || (!draft.apiToken && !hasStoredToken)}
            >
              {isTesting ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={Link01Icon} className="size-4" strokeWidth={2} />
              )}
              Test connection
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || (!draft.apiToken && !hasStoredToken)}
            >
              {isSaving ? (
                <Spinner className="size-4" />
              ) : (
                <HugeiconsIcon icon={Tick02Icon} className="size-4" strokeWidth={2} />
              )}
              {isSplash ? "Get started" : isCreate ? "Add instance" : "Save changes"}
            </Button>
            {isEdit && onRemove ? (
              <Button
                type="button"
                variant="destructive-outline"
                onClick={() => void onRemove()}
              >
                Remove instance
              </Button>
            ) : null}
          </div>

          {feedback ? (
            <p
              className={
                feedback.type === "success"
                  ? "text-sm text-success-foreground"
                  : "text-sm text-destructive"
              }
            >
              {feedback.message}
            </p>
          ) : null}
        </CardPanel>
      </Card>

      {isSplash ? (
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm">
          <CardPanel className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-medium">Appearance</p>
              <p className="text-sm text-muted-foreground">
                Choose light or dark mode for the app.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={Sun03Icon} className="size-4" strokeWidth={2} />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Toggle dark mode"
              />
              <HugeiconsIcon icon={Moon02Icon} className="size-4" strokeWidth={2} />
            </div>
          </CardPanel>
        </Card>
      ) : null}
    </div>
  );
};

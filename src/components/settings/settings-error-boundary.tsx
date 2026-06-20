"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type SettingsErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
};

type SettingsErrorBoundaryState = {
  error: Error | null;
};

export class SettingsErrorBoundary extends Component<
  SettingsErrorBoundaryProps,
  SettingsErrorBoundaryState
> {
  state: SettingsErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): SettingsErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Settings view failed to render:", error, info.componentStack);
  }

  handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">
              {this.props.fallbackTitle ?? "Settings failed to load"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error.message ||
                "Something went wrong while opening settings."}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={this.handleRetry}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

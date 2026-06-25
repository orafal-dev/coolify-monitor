"use client";

import { ExternalLinkIcon } from "lucide-react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { openExternalUrl } from "@/lib/external-link";
import type { ExternalUrlItem } from "@/lib/coolify/urls.types";
import { cn } from "@/lib/utils";

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  showIcon?: boolean;
  truncate?: boolean;
  ariaLabel?: string;
};

export const ExternalLink = ({
  href,
  children,
  className,
  showIcon = true,
  truncate = true,
  ariaLabel,
}: ExternalLinkProps) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    void openExternalUrl(href);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>): void => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    void openExternalUrl(href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={ariaLabel ?? (typeof children === "string" ? children : undefined)}
      className={cn(
        "inline-flex max-w-full items-center gap-1 text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        truncate && "truncate",
        className,
      )}
    >
      <span className={cn(truncate && "truncate")}>{children}</span>
      {showIcon ? (
        <ExternalLinkIcon className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
      ) : null}
    </a>
  );
};

type ExternalUrlLinksProps = {
  items: ExternalUrlItem[];
  className?: string;
  linkClassName?: string;
  showIcon?: boolean;
};

export const ExternalUrlLinks = ({
  items,
  className,
  linkClassName,
  showIcon = true,
}: ExternalUrlLinksProps) => {
  if (!items.length) {
    return null;
  }

  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1", className)}>
      {items.map((item) => (
        <ExternalLink
          key={item.href}
          href={item.href}
          showIcon={showIcon}
          ariaLabel={`Open ${item.label}`}
          className={cn("text-sm", linkClassName)}
        >
          {item.label}
        </ExternalLink>
      ))}
    </div>
  );
};

type ExternalLinkButtonProps = {
  href: string;
  label: string;
  className?: string;
};

export const ExternalLinkButton = ({
  href,
  label,
  className,
}: ExternalLinkButtonProps) => {
  const handleClick = (): void => {
    void openExternalUrl(href);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className={className}
      onClick={handleClick}
      aria-label={label}
      title={label}
    >
      <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
    </Button>
  );
};

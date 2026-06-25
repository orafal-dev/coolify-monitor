"use client";

import { motion } from "framer-motion";
import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  filterAndSortResourceRows,
} from "@/lib/coolify/resource-table-utils";
import { formatRelativeTime } from "@/lib/coolify/status";
import type {
  ResourceRow,
  ResourceSortOption,
  ResourceTableProps,
} from "@/components/dashboard/resource-table.types";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardPanel } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  ExternalLinkButton,
  ExternalUrlLinks,
} from "@/components/ui/external-link";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectItem,
  SelectPopup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SORT_OPTIONS: { value: ResourceSortOption; label: string }[] = [
  { value: "name", label: "Name (A–Z)" },
  { value: "status", label: "Status (issues first)" },
  { value: "updated", label: "Updated (newest)" },
];

const renderMetaCell = (row: ResourceRow) => {
  if (row.metaLinks?.length) {
    return <ExternalUrlLinks items={row.metaLinks} showIcon={false} />;
  }

  return <span className="text-sm text-muted-foreground">{row.meta ?? "—"}</span>;
};

const renderActionsCell = (row: ResourceRow) => {
  const actionLinks = [
    ...(row.coolifyUrl
      ? [{ label: "Open in Coolify", url: row.coolifyUrl, variant: "coolify" as const }]
      : []),
    ...(row.links ?? []),
  ];

  if (!actionLinks.length) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      {actionLinks.map((link) => (
        <ExternalLinkButton
          key={`${row.id}-${link.label}`}
          href={link.url}
          label={link.label}
        />
      ))}
    </div>
  );
};

export const ResourceTable = ({
  title,
  description,
  rows,
  isLoading,
  emptyTitle,
  emptyDescription,
}: ResourceTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<ResourceSortOption>("name");

  const visibleRows = useMemo(
    () => filterAndSortResourceRows(rows, searchQuery, sortBy),
    [rows, searchQuery, sortBy],
  );

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardPanel className="space-y-3 py-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardPanel>
      </Card>
    );
  }

  if (!rows.length) {
    return (
      <Card className="border-border/60">
        <CardPanel className="py-10">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyDescription>{emptyDescription}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardPanel>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="overflow-hidden border-border/60">
        <CardPanel className="space-y-4 py-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <SearchIcon
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by name or details…"
                  className="pl-9"
                  aria-label={`Search ${title.toLowerCase()}`}
                />
              </div>
              <Select
                value={sortBy}
                items={SORT_OPTIONS}
                onValueChange={(value) => setSortBy(value as ResourceSortOption)}
              >
                <SelectTrigger className="w-full sm:w-52" aria-label="Sort resources">
                  <SelectValue />
                </SelectTrigger>
                <SelectPopup>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectPopup>
              </Select>
            </div>
          </div>

          {!visibleRows.length ? (
            <Empty className="py-8">
              <EmptyHeader>
                <EmptyTitle>No matches</EmptyTitle>
                <EmptyDescription>
                  Try a different search term or clear the filter.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[36%]">Name</TableHead>
                  <TableHead className="w-[16%]">Status</TableHead>
                  <TableHead className="w-[28%]">Details</TableHead>
                  <TableHead className="w-[12%] text-right">Updated</TableHead>
                  <TableHead className="w-20 text-right">Links</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow key={row.id} className="transition-colors hover:bg-muted/40">
                    <TableCell className="max-w-0 whitespace-normal">
                      <div className="min-w-0">
                        <p className="truncate font-medium" title={row.name}>
                          {row.name}
                        </p>
                        {row.secondary ? (
                          <p
                            className="truncate text-xs text-muted-foreground"
                            title={row.secondary}
                          >
                            {row.secondary}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="max-w-0 whitespace-normal">
                      <div className="min-w-0 truncate">{renderMetaCell(row)}</div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm text-muted-foreground">
                      {formatRelativeTime(row.updatedAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {renderActionsCell(row)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardPanel>
      </Card>
    </motion.div>
  );
};

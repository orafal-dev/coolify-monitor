"use client";

import { motion } from "framer-motion";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardPanel } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelativeTime } from "@/lib/coolify/status";

type ResourceRow = {
  id: string;
  name: string;
  status?: string | null;
  meta?: string | null;
  secondary?: string | null;
  updatedAt?: string | null;
};

type ResourceTableProps = {
  title: string;
  description: string;
  rows: ResourceRow[];
  isLoading: boolean;
  emptyTitle: string;
  emptyDescription: string;
};

export const ResourceTable = ({
  title,
  description,
  rows,
  isLoading,
  emptyTitle,
  emptyDescription,
}: ResourceTableProps) => {
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
      <Card className="border-border/60 overflow-hidden">
        <CardPanel className="space-y-4 py-6">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="transition-colors hover:bg-muted/40">
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium">{row.name}</p>
                      {row.secondary ? (
                        <p className="text-xs text-muted-foreground">
                          {row.secondary}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {row.meta ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatRelativeTime(row.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardPanel>
      </Card>
    </motion.div>
  );
};

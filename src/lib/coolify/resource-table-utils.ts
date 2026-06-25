import type { ResourceRow, ResourceSortOption } from "@/components/dashboard/resource-table.types";
import { getStatusSeverity } from "@/lib/coolify/status";

export const filterResourceRows = (
  rows: ResourceRow[],
  query: string,
): ResourceRow[] => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return rows;
  }

  return rows.filter((row) => {
    const haystack = [row.name, row.meta, row.secondary]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
};

const compareUpdatedAt = (left?: string | null, right?: string | null): number => {
  const leftTime = left ? new Date(left).getTime() : Number.NaN;
  const rightTime = right ? new Date(right).getTime() : Number.NaN;

  if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) {
    return 0;
  }

  if (Number.isNaN(leftTime)) {
    return 1;
  }

  if (Number.isNaN(rightTime)) {
    return -1;
  }

  return rightTime - leftTime;
};

export const sortResourceRows = (
  rows: ResourceRow[],
  sortBy: ResourceSortOption,
): ResourceRow[] => {
  const sorted = [...rows];

  switch (sortBy) {
    case "status":
      sorted.sort((left, right) => {
        const severityDiff =
          getStatusSeverity(left.status) - getStatusSeverity(right.status);
        if (severityDiff !== 0) {
          return severityDiff;
        }

        return left.name.localeCompare(right.name);
      });
      break;
    case "updated":
      sorted.sort((left, right) => {
        const updatedDiff = compareUpdatedAt(left.updatedAt, right.updatedAt);
        if (updatedDiff !== 0) {
          return updatedDiff;
        }

        return left.name.localeCompare(right.name);
      });
      break;
    case "name":
    default:
      sorted.sort((left, right) => left.name.localeCompare(right.name));
      break;
  }

  return sorted;
};

export const filterAndSortResourceRows = (
  rows: ResourceRow[],
  query: string,
  sortBy: ResourceSortOption,
): ResourceRow[] => sortResourceRows(filterResourceRows(rows, query), sortBy);

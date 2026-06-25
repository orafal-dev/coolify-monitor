export type ResourceRowMetaLink = {
  href: string;
  label: string;
};

export type ResourceRowLink = {
  label: string;
  url: string;
  variant?: "site" | "repo" | "coolify" | "default";
};

export type ResourceRow = {
  id: string;
  name: string;
  status?: string | null;
  meta?: string | null;
  secondary?: string | null;
  updatedAt?: string | null;
  metaLinks?: ResourceRowMetaLink[];
  coolifyUrl?: string | null;
  links?: ResourceRowLink[];
};

export type ResourceSortOption = "name" | "status" | "updated";

export type ResourceTableProps = {
  title: string;
  description: string;
  rows: ResourceRow[];
  isLoading: boolean;
  emptyTitle: string;
  emptyDescription: string;
};

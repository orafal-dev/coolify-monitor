import type { ComponentProps, ReactElement } from "react";
import { cn } from "@/lib/utils";

type WindowDragRegionProps = ComponentProps<"div">;

export const WindowDragRegion = ({
  className,
  ...props
}: WindowDragRegionProps): ReactElement => (
  <div
    data-tauri-drag-region="deep"
    className={cn("select-none", className)}
    {...props}
  />
);

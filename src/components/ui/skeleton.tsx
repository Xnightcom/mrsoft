import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  w?: string | number;
  h?: string | number;
  rounded?: boolean;
}

export function Skeleton({ className, w, h, rounded, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(className)}
      style={{
        width: w ?? "100%",
        height: h ?? 16,
        borderRadius: rounded ? 9999 : 8,
        background: `linear-gradient(
          90deg,
          rgba(255,255,255,0.04) 0%,
          rgba(255,255,255,0.08) 50%,
          rgba(255,255,255,0.04) 100%
        )`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease infinite",
        ...style,
      }}
      {...props}
    />
  );
}

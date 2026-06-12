import React from "react";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const norm = status.toLowerCase().replace(/_/g, " ");

  let style = "bg-gray-500/10 text-gray-400 border-gray-500/20"; // default

  switch (norm) {
    case "pending":
    case "planning":
    case "review":
      style = "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      break;
    case "reviewed":
    case "development":
    case "in progress":
    case "submitted":
      style = "bg-blue-500/10 text-blue-400 border-blue-500/20";
      break;
    case "completed":
    case "delivered":
    case "paid":
    case "graded":
    case "active":
      style = "bg-[#1A6B1A]/10 text-[#22c55e] border-[#1A6B1A]/20";
      break;
    case "overdue":
    case "absent":
    case "failed":
    case "suspended":
      style = "bg-[#CC0000]/10 text-[#ef4444] border-[#CC0000]/20";
      break;
  }

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${style}`}>
      {norm}
    </span>
  );
}

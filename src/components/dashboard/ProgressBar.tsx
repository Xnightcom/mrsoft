import React from "react";

interface ProgressBarProps {
  value: number;
  color?: "red" | "green" | "blue" | "yellow";
  showLabel?: boolean;
}

export function ProgressBar({ value, color = "green", showLabel = true }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  const colorMap = {
    red: "bg-[#CC0000] shadow-[0_0_8px_rgba(204,0,0,0.6)]",
    green: "bg-[#1A6B1A] shadow-[0_0_8px_rgba(26,107,26,0.6)]",
    blue: "bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]",
    yellow: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]",
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className="text-xs font-medium text-white/50">Progress</span>
        )}
        {showLabel && (
          <span className="text-xs font-semibold text-white">{clamped}%</span>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorMap[color]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

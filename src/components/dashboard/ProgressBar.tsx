import React from "react";

interface ProgressBarProps {
  value: number;
  color?: "red" | "green" | "blue" | "yellow";
  showLabel?: boolean;
}

export function ProgressBar({ value, color, showLabel = true }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 100);

  const colorMap = {
    red: "#CC0000",
    green: "#1A6B1A",
    blue: "#2563eb",
    yellow: "#F59E0B",
  };

  const bg = color 
    ? colorMap[color] 
    : (clamped > 70 
      ? '#1A6B1A'
      : clamped > 40 
        ? '#F59E0B' 
        : '#CC0000');

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
      <div style={{
        height: 6,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 999,
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${clamped}%`,
          background: bg,
          borderRadius: 999,
          transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
          animation: 'progressIn 1s ease forwards',
          // @ts-ignore
          '--progress': `${clamped}%`
        }} />
      </div>
    </div>
  );
}

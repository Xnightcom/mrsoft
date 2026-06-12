import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "red" | "green" | "blue" | "yellow";
}

export function StatCard({ title, value, icon: Icon, color = "red" }: StatCardProps) {
  const colorMap = {
    red: "bg-[#CC0000]/10 text-[#CC0000] border-[#CC0000]/30 hover:border-[#CC0000] hover:shadow-[0_0_15px_rgba(204,0,0,0.25)]",
    green: "bg-[#1A6B1A]/10 text-[#1A6B1A] border-[#1A6B1A]/30 hover:border-[#1A6B1A] hover:shadow-[0_0_15px_rgba(26,107,26,0.25)]",
    blue: "bg-[#1A3A6B]/10 text-[#3B82F6] border-[#1A3A6B]/30 hover:border-[#3B82F6] hover:shadow-[0_0_15px_rgba(59,130,246,0.25)]",
    yellow: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30 hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(234,179,8,0.25)]",
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[rgba(26,107,26,0.3)] bg-[#0F0F0F] p-6 transition-all duration-300 hover:border-[#CC0000]/50 hover:shadow-[0_0_20px_rgba(204,0,0,0.15)] group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/50">{title}</p>
          <h3 className="mt-2 text-4xl font-bold tracking-tight text-white md:text-5xl">
            {value}
          </h3>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300 ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "./layoutUtils";

export type ModuleNodeData = {
  label: string;
  status: "in" | "out" | "maybe";
  category?: string;
  description?: string;
  onStatusChange?: (nodeId: string, status: "in" | "out" | "maybe") => void;
};

const statusStyles = {
  in: {
    ring: "ring-2 ring-green-400/50 shadow-green-500/20",
    badge: "bg-green-500 text-white",
    glow: "shadow-lg shadow-green-500/30",
  },
  out: {
    ring: "ring-1 ring-red-300/30",
    badge: "bg-red-500/20 text-red-300",
    glow: "",
  },
  maybe: {
    ring: "ring-2 ring-yellow-400/40 shadow-yellow-500/20",
    badge: "bg-yellow-500 text-white",
    glow: "shadow-md shadow-yellow-500/20",
  },
};

const statusLabels = {
  in: "✓ Include",
  out: "✗ Exclude",
  maybe: "? Maybe",
};

function ModuleNode({ data, id, selected }: NodeProps<ModuleNodeData>) {
  const handleStatusClick = (newStatus: "in" | "out" | "maybe") => {
    data.onStatusChange?.(id, newStatus);
  };

  const categoryStyle = data.category ? getCategoryStyle(data.category) : null;
  const statusStyle = statusStyles[data.status];

  return (
    <div
      className={cn(
        "relative rounded-xl min-w-[220px] transition-all duration-300",
        statusStyle.ring,
        statusStyle.glow,
        selected && "scale-105 ring-4 ring-primary/50"
      )}
    >
      {/* Gradient Background */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl opacity-90",
          categoryStyle ? `bg-gradient-to-br ${categoryStyle.gradient}` : "bg-gradient-to-br from-slate-700 to-slate-800"
        )}
      />

      {/* Content */}
      <div className="relative px-4 py-3 backdrop-blur-sm">
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-white/80 border-2 border-gray-300"
        />

        <div className="space-y-2">
          {/* Header with Icon */}
          <div className="flex items-start gap-2">
            {categoryStyle && (
              <categoryStyle.icon className="w-5 h-5 flex-shrink-0 mt-0.5 text-white/90" strokeWidth={2} />
            )}
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold text-sm leading-tight",
                categoryStyle?.textColor || "text-white"
              )}>
                {data.label}
              </h3>
              {data.category && (
                <p className="text-xs text-white/70 mt-0.5 truncate">{data.category}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {data.description && (
            <p className="text-xs text-white/80 line-clamp-2 leading-snug">
              {data.description}
            </p>
          )}

          {/* Status Badge */}
          <div className="flex gap-1.5 pt-1">
            {(["in", "maybe", "out"] as const).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusClick(status)}
                className={cn(
                  "flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                  data.status === status
                    ? statusStyles[status].badge + " shadow-md"
                    : "bg-white/10 text-white/60 hover:bg-white/20 border border-white/10"
                )}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-white/80 border-2 border-gray-300"
        />
      </div>

      {/* Glow effect overlay for selected */}
      {selected && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

export default memo(ModuleNode);

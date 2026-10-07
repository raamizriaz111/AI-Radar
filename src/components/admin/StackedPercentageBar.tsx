'use client';

// =============================================================================
// AI Radar — Full-Width Stacked Proportional Bar (100% Breakdown)
// =============================================================================

import React, { useState } from 'react';
import type { PercentageBreakdownItem } from '@/lib/services/adminTelemetryService';

interface StackedPercentageBarProps {
  items: PercentageBreakdownItem[];
  title?: string;
  className?: string;
}

export function StackedPercentageBar({
  items,
  title,
  className,
}: StackedPercentageBarProps) {
  const [hoveredItem, setHoveredItem] = useState<PercentageBreakdownItem | null>(null);

  return (
    <div className={className}>
      {title && (
        <div className="mb-2.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground/90">{title}</span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {hoveredItem ? (
              <span className="text-foreground font-bold">
                {hoveredItem.label}: {hoveredItem.percentage}% ({hoveredItem.count} items)
              </span>
            ) : (
              '100.0% Normalized Total'
            )}
          </span>
        </div>
      )}

      {/* Multi-Segment Horizontal Bar */}
      <div className="relative flex h-4 w-full overflow-hidden rounded-full bg-white/[0.05] p-0.5 border border-white/[0.08]">
        {items.map((item) => {
          if (item.percentage <= 0) return null;
          const isHovered = hoveredItem?.id === item.id;
          return (
            <div
              key={item.id}
              style={{
                width: `${item.percentage}%`,
                backgroundColor: item.color,
              }}
              className={`h-full transition-all duration-200 cursor-pointer ${
                isHovered ? 'brightness-125 scale-y-110 z-10' : 'hover:brightness-110'
              }`}
              onMouseEnter={() => setHoveredItem(item)}
              onMouseLeave={() => setHoveredItem(null)}
              title={`${item.label}: ${item.percentage}% (${item.count} items)`}
            />
          );
        })}
      </div>

      {/* Quick Legend Chips */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
            onMouseEnter={() => setHoveredItem(item)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <span
              className="h-2 w-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground truncate">{item.label}</span>
            <span className="font-mono font-semibold text-foreground/90">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

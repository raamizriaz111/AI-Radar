'use client';

// =============================================================================
// AI Radar — Interactive SVG Donut Percentage Chart (Out of 100%)
// =============================================================================

import React, { useState } from 'react';
import type { PercentageBreakdownItem } from '@/lib/services/adminTelemetryService';

interface PercentageDonutChartProps {
  items: PercentageBreakdownItem[];
  totalLabel?: string;
  totalCount?: number;
  size?: number;
}

export function PercentageDonutChart({
  items,
  totalLabel = 'Total Analyzed',
  totalCount,
  size = 240,
}: PercentageDonutChartProps) {
  const [activeItem, setActiveItem] = useState<PercentageBreakdownItem | null>(null);

  const radius = 80;
  const strokeWidth = 24;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute total count if not provided
  const total = totalCount ?? items.reduce((sum, item) => sum + item.count, 0);

  // Compute SVG stroke-dasharray offsets
  let cumulativePercentage = 0;
  const slices = items.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
    cumulativePercentage += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between gap-6">
      {/* SVG Donut Circle */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          {/* Background Ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {slices.map((slice) => {
            const isHovered = activeItem?.id === slice.id;
            return (
              <circle
                key={slice.id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setActiveItem(slice)}
                onMouseLeave={() => setActiveItem(null)}
                style={{
                  filter: isHovered ? `drop-shadow(0 0 8px ${slice.color}80)` : undefined,
                }}
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          {activeItem ? (
            <>
              <span className="text-2xl font-extrabold tracking-tight text-foreground font-mono">
                {activeItem.percentage}%
              </span>
              <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[120px]">
                {activeItem.label}
              </span>
              <span className="text-[10px] text-muted-foreground/60">
                {activeItem.count} items
              </span>
            </>
          ) : (
            <>
              <span className="text-2xl font-extrabold tracking-tight text-foreground font-mono">
                100%
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                {totalLabel}
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-mono">
                {total} items
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend & Breakdown List */}
      <div className="flex-1 w-full space-y-2">
        {items.map((item) => {
          const isHovered = activeItem?.id === item.id;
          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2 rounded-lg transition-colors cursor-pointer ${
                isHovered ? 'bg-white/[0.08]' : 'hover:bg-white/[0.03]'
              }`}
              onMouseEnter={() => setActiveItem(item)}
              onMouseLeave={() => setActiveItem(null)}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-foreground truncate">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] text-muted-foreground">
                  {item.count} items
                </span>
                <span
                  className="text-xs font-bold font-mono px-2 py-0.5 rounded border border-white/[0.08] bg-black/40 min-w-[52px] text-right"
                  style={{ color: item.color }}
                >
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

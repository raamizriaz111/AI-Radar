'use client';

// =============================================================================
// AI Radar — Ranked Horizontal Distribution Bars Component
// =============================================================================

import React from 'react';
import type { PercentageBreakdownItem } from '@/lib/services/adminTelemetryService';

interface HorizontalDistributionBarsProps {
  items: PercentageBreakdownItem[];
  title?: string;
  maxDisplay?: number;
}

export function HorizontalDistributionBars({
  items,
  title,
  maxDisplay = 8,
}: HorizontalDistributionBarsProps) {
  const displayItems = items.slice(0, maxDisplay);
  const highestPercentage = displayItems[0]?.percentage || 100;

  return (
    <div className="space-y-3.5">
      {title && (
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
          {title}
        </h4>
      )}

      <div className="space-y-3">
        {displayItems.map((item, index) => {
          // Relative bar width against highest or 100%
          const relativeWidth = Math.max(4, (item.percentage / highestPercentage) * 100);

          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-white/[0.06] text-[10px] font-mono text-muted-foreground">
                    #{index + 1}
                  </span>
                  <span className="font-semibold text-foreground truncate">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0 font-mono text-xs">
                  <span className="text-muted-foreground text-[11px]">
                    {item.count} items
                  </span>
                  <span className="font-bold text-foreground min-w-[48px] text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${relativeWidth}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

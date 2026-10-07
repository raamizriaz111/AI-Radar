'use client';

// =============================================================================
// AI Radar — Activity Ingestion Timeline & Velocity Chart
// =============================================================================

import React from 'react';

interface ActivityTimelineChartProps {
  timeline: Array<{
    period: string;
    count: number;
    percentage: number;
  }>;
}

export function ActivityTimelineChart({ timeline }: ActivityTimelineChartProps) {
  const maxCount = Math.max(...timeline.map((t) => t.count), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">Ingestion Velocity & Distribution</span>
        <span className="text-[11px] font-mono text-muted-foreground">Recent Pipeline Activity</span>
      </div>

      {/* Vertical Bar Matrix */}
      <div className="grid grid-cols-5 gap-2 items-end h-40 pt-4 pb-2 px-1 border-b border-white/[0.08]">
        {timeline.map((item, idx) => {
          const heightPct = Math.max(12, Math.round((item.count / maxCount) * 100));

          return (
            <div key={idx} className="group flex flex-col items-center h-full justify-end gap-2">
              <span className="text-[10px] font-mono font-bold text-foreground opacity-80 group-hover:opacity-100 group-hover:text-primary transition-colors">
                {item.percentage}%
              </span>

              {/* Bar Column */}
              <div className="w-full max-w-[48px] h-full flex items-end">
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-primary/30 to-primary/80 group-hover:from-primary/50 group-hover:to-primary transition-all duration-300 shadow-sm shadow-primary/20"
                />
              </div>

              <span className="text-[10px] text-muted-foreground truncate w-full text-center group-hover:text-foreground transition-colors">
                {item.count} items
              </span>
            </div>
          );
        })}
      </div>

      {/* Period Labels */}
      <div className="grid grid-cols-5 gap-2 text-center text-[11px] text-muted-foreground font-mono">
        {timeline.map((item, idx) => (
          <span key={idx} className="truncate">
            {item.period}
          </span>
        ))}
      </div>
    </div>
  );
}

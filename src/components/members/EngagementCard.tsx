"use client";

import { Card } from "@/components/ui/Card";
import { EngagementChart } from "@/components/ui/EngagementChart";
import { formatDate } from "@/lib/utils";
import type { MemberActivity } from "@/types/member";

interface EngagementCardProps {
  activity: MemberActivity[];
  hasEngagementData: boolean;
}

/**
 * Aggregate activity records into 8 weekly buckets for the chart.
 * Most recent week is on the right.
 */
function buildWeeklyData(activity: MemberActivity[]): { label: string; value: number }[] {
  const weeks: { label: string; value: number }[] = [];

  for (let w = 7; w >= 0; w--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - w * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekMessages = activity
      .filter((a) => {
        const d = new Date(a.date);
        return d >= weekStart && d < weekEnd;
      })
      .reduce((sum, a) => sum + a.messages_sent, 0);

    weeks.push({ label: `W${8 - w}`, value: weekMessages });
  }
  return weeks;
}

export function EngagementCard({ activity, hasEngagementData }: EngagementCardProps) {
  const chartData = buildWeeklyData(activity);

  // Find last seen date from activity
  const lastSeen = activity
    .filter((a) => a.last_seen_at)
    .sort((a, b) => new Date(b.last_seen_at!).getTime() - new Date(a.last_seen_at!).getTime())[0];

  return (
    <Card>
      <div className="text-label font-bold mb-3.5 flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="8" y2="16" />
          <line x1="16" y1="10" x2="16" y2="16" />
        </svg>
        Engagement (8 weeks)
      </div>

      {hasEngagementData ? (
        <>
          <EngagementChart data={chartData} />
          <div className="flex justify-between mt-2.5 text-[11px] text-text-muted">
            <span>Messages / week</span>
            <span>
              Last seen: {lastSeen?.last_seen_at ? formatDate(lastSeen.last_seen_at) : "—"}
            </span>
          </div>
        </>
      ) : (
        <div className="text-xs text-text-muted py-4 text-center">
          <p className="mb-1">No engagement data available</p>
          <p className="text-[11px]">Connect Discord or enable Whop Chat to track activity</p>
        </div>
      )}
    </Card>
  );
}

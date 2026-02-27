"use client";

import { Button } from "@/components/ui/Button";
import { RiskPill } from "@/components/ui/RiskPill";
import { cn, initials, formatCurrencyShort } from "@/lib/utils";
import type { MemberWithRisk } from "@/types/member";
import type { RiskLevel } from "@/types/risk";

interface MemberListProps {
  members: MemberWithRisk[];
  onMemberClick: (memberId: string) => void;
  isMobile: boolean;
}

const riskColorMap: Record<RiskLevel, string> = {
  critical: "#ff4757",
  high: "#ffa502",
  medium: "#3b82f6",
  low: "#2ed573",
};

export function MemberList({ members, onMemberClick, isMobile }: MemberListProps) {
  return (
    <div className="flex flex-col gap-[1px]">
      {/* Header */}
      {!isMobile && (
        <div
          className="grid gap-3 px-4 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-[0.06em]"
          style={{ gridTemplateColumns: "1fr 70px 70px 70px 150px" }}
        >
          <span>Member</span>
          <span className="text-center">Risk</span>
          <span className="text-center">Renewal</span>
          <span className="text-center">LTV</span>
          <span className="text-right">Actions</span>
        </div>
      )}

      {/* Rows */}
      {members.map((m, idx) => {
        const level = m.risk_level || "low";
        const color = riskColorMap[level];
        const memberInitials = initials(m.username || m.first_name);
        const daysUntilRenewal = m.current_period_end
          ? Math.max(0, Math.ceil((new Date(m.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null;

        return (
          <div
            key={m.id}
            onClick={() => onMemberClick(m.id)}
            className={cn(
              "card-base rounded-[10px] cursor-pointer transition-all duration-150 mb-0.5 hover:bg-surface-card-hover",
            )}
            style={{
              display: isMobile ? "flex" : "grid",
              gridTemplateColumns: isMobile ? undefined : "1fr 70px 70px 70px 150px",
              flexDirection: isMobile ? "column" : undefined,
              gap: isMobile ? 8 : 12,
              alignItems: isMobile ? "stretch" : "center",
              padding: isMobile ? "12px 14px" : "11px 16px",
              animation: `fadeSlideIn 0.3s ease ${idx * 0.03}s both`,
            }}
          >
            {/* Member info */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-extrabold tracking-tight"
                  style={{
                    background: `linear-gradient(135deg, ${color}30, ${color}10)`,
                    color,
                  }}
                >
                  {memberInitials}
                </div>
                <span
                  className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 rounded-full border-2 border-surface-card"
                  style={{ background: color }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold text-text-primary truncate">
                  {m.username || m.first_name || "Unknown"}
                </div>
                <div className="text-[11px] text-text-muted truncate">
                  {m.cancel_at_period_end
                    ? "Cancellation scheduled"
                    : m.recent_payment_failures > 0
                      ? `${m.recent_payment_failures} payment failure(s)`
                      : level === "low"
                        ? "Healthy"
                        : "At risk"}
                </div>
              </div>
            </div>

            {isMobile ? (
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <RiskPill level={level} />
                  {daysUntilRenewal != null && (
                    <span className="text-[11px] text-text-muted">
                      Renews {daysUntilRenewal}d
                    </span>
                  )}
                </div>
                <span className="text-[13px] font-bold text-text-primary font-heading">
                  {formatCurrencyShort(m.ltv_cents)}
                </span>
              </div>
            ) : (
              <>
                {/* Risk score */}
                <div className="text-center">
                  <span
                    className="text-base font-extrabold font-heading"
                    style={{ color }}
                  >
                    {m.risk_score ?? "—"}
                  </span>
                </div>

                {/* Renewal */}
                <div className="text-center text-xs text-text-secondary font-medium">
                  {daysUntilRenewal != null ? `${daysUntilRenewal} days` : "—"}
                </div>

                {/* LTV */}
                <div className="text-center text-xs font-bold text-text-primary font-heading">
                  {formatCurrencyShort(m.ltv_cents)}
                </div>

                {/* Actions */}
                <div
                  className="flex gap-[5px] justify-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  {level === "critical" || level === "high" ? (
                    <>
                      <Button variant="accent" size="xs">
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Playbook
                      </Button>
                      <Button variant="default" size="xs">
                        <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                        </svg>
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="xs">View</Button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}

      {members.length === 0 && (
        <div className="card-base rounded-[10px] px-4 py-8 text-center text-sm text-text-muted">
          No members match this filter.
        </div>
      )}
    </div>
  );
}

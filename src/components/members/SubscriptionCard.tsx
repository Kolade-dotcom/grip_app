import { Card } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { MemberDetail } from "@/types/member";

interface SubscriptionCardProps {
  member: MemberDetail;
}

export function SubscriptionCard({ member }: SubscriptionCardProps) {
  const rows: [string, string, boolean][] = [
    [
      "Plan",
      member.plan_name
        ? `${member.plan_name} (${formatCurrency(member.plan_price_cents ?? 0)}/mo)`
        : "—",
      false,
    ],
    [
      "Since",
      member.current_period_start
        ? `${formatDate(member.current_period_start)} (${member.tenure_days ?? 0} days)`
        : "—",
      false,
    ],
    [
      "Renewal",
      member.current_period_end
        ? `${formatDate(member.current_period_end)}${member.cancel_at_period_end ? "  \u26A0\uFE0F CANCEL SCHEDULED" : ""}`
        : "—",
      !!member.cancel_at_period_end,
    ],
    ["LTV", formatCurrency(member.ltv_cents), false],
    [
      "Failures",
      member.recent_payment_failures > 0
        ? `${member.recent_payment_failures} recent`
        : "None",
      member.recent_payment_failures > 0,
    ],
  ];

  return (
    <Card>
      <div className="text-label font-bold mb-3.5 flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        Subscription
      </div>
      {rows.map(([label, value, isDanger], i) => (
        <div
          key={label}
          className="flex justify-between py-[7px]"
          style={i < rows.length - 1 ? { borderBottom: "1px solid var(--border)" } : undefined}
        >
          <span className="text-xs text-text-muted">{label}</span>
          <span className={`text-xs font-semibold ${isDanger ? "text-risk-critical" : "text-text-primary"}`}>
            {value}
          </span>
        </div>
      ))}
    </Card>
  );
}

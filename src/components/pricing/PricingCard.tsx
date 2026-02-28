"use client";

import { Button } from "@/components/ui/Button";
import { PLAN_LIMITS, getPlanLabel, getPlanPrice } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/plan-limits";

type PricingCardProps = {
  tier: PlanTier;
  isCurrent: boolean;
  isPopular: boolean;
  onSelect: (tier: PlanTier) => void;
  isDark: boolean;
};

type FeatureEntry = { label: string; included: boolean };

function getTierFeatures(tier: PlanTier): FeatureEntry[] {
  const l = PLAN_LIMITS[tier];
  const features: FeatureEntry[] = [
    {
      label: l.maxMembers === Infinity ? "Unlimited members" : `Up to ${l.maxMembers.toLocaleString()} members`,
      included: true,
    },
    {
      label: l.playbooks === Infinity
        ? "Unlimited playbooks + custom builder"
        : l.playbooks > 0
          ? `${l.playbooks} automated playbook${l.playbooks > 1 ? "s" : ""}`
          : "No playbooks",
      included: l.playbooks > 0,
    },
    {
      label: "Manual emails",
      included: l.manualEmails > 0,
    },
    {
      label: "Automated outreach",
      included: l.automatedOutreach,
    },
    {
      label: "Discord integration",
      included: l.discordIntegration,
    },
    {
      label: "Telegram integration",
      included: l.telegramIntegration,
    },
    {
      label: "AI personalization",
      included: l.aiPersonalization,
    },
    {
      label: "A/B testing",
      included: l.abTesting,
    },
  ];

  if (tier === "enterprise") {
    features.push(
      { label: "Multi-community support", included: true },
      { label: "White-label branding", included: true }
    );
  }

  return features;
}

export function PricingCard({ tier, isCurrent, isPopular, onSelect, isDark }: PricingCardProps) {
  const price = getPlanPrice(tier);
  const label = getPlanLabel(tier);
  const features = getTierFeatures(tier);

  return (
    <div
      className="card-base card-shine rounded-card p-5 flex flex-col relative"
      style={{
        borderColor: isCurrent
          ? "rgba(110, 86, 255, 0.4)"
          : isPopular
            ? "rgba(110, 86, 255, 0.25)"
            : undefined,
      }}
    >
      {isPopular && !isCurrent && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-accent text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
          Most Popular
        </span>
      )}

      <div className="mb-4">
        <h3 className="font-heading text-lg font-extrabold text-text-primary">{label}</h3>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="font-heading text-3xl font-extrabold text-text-primary">
            {price === 0 ? "Free" : `$${price}`}
          </span>
          {price > 0 && (
            <span className="text-sm text-text-muted">/mo</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1 mb-5">
        {features.map((f) => (
          <div key={f.label} className="flex items-start gap-2">
            {f.included ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5 text-text-muted">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            <span className={`text-xs ${f.included ? "text-text-primary" : "text-text-muted"}`}>
              {f.label}
            </span>
          </div>
        ))}
      </div>

      {isCurrent ? (
        <Button variant="default" size="sm" className="w-full opacity-60 cursor-default">
          Current Plan
        </Button>
      ) : tier === "enterprise" ? (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => onSelect(tier)}>
          Contact Us
        </Button>
      ) : (
        <Button variant="primary" size="sm" className="w-full" onClick={() => onSelect(tier)}>
          Upgrade
        </Button>
      )}
    </div>
  );
}

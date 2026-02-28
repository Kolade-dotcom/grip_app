"use client";

import { PricingCard } from "./PricingCard";
import { getPlanLabel } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/plan-limits";

type PricingScreenProps = {
  currentTier: PlanTier;
  isMobile: boolean;
  isDark: boolean;
  onBack: () => void;
};

const TIERS: PlanTier[] = ["free", "starter", "growth", "pro", "enterprise"];

export function PricingScreen({ currentTier, isMobile, isDark, onBack }: PricingScreenProps) {
  const handleSelect = (tier: PlanTier) => {
    if (tier === "enterprise") {
      window.open("mailto:support@gripretention.com?subject=Enterprise Plan Inquiry", "_blank");
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Back nav */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-5 bg-transparent border-none cursor-pointer"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Settings
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-heading text-xl font-extrabold text-text-primary">
          Plans & Pricing
        </h2>
        <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-accent/10 text-accent">
          {getPlanLabel(currentTier)}
        </span>
      </div>

      {/* Pricing grid */}
      <div
        className="grid gap-3 mb-8"
        style={{
          gridTemplateColumns: isMobile
            ? "1fr"
            : "repeat(3, 1fr)",
        }}
      >
        {TIERS.map((tier) => (
          <PricingCard
            key={tier}
            tier={tier}
            isCurrent={tier === currentTier}
            isPopular={tier === "growth"}
            onSelect={handleSelect}
            isDark={isDark}
          />
        ))}
      </div>
    </div>
  );
}

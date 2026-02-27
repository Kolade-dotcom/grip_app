"use client";

import { Button } from "@/components/ui/Button";
import { getUpgradeTier, getPlanLabel, getPlanPrice, type PlanTier } from "@/lib/plan-limits";

interface UpgradePromptProps {
  currentTier: PlanTier;
  feature: string;
  onClose?: () => void;
}

export function UpgradePrompt({ currentTier, feature, onClose }: UpgradePromptProps) {
  const nextTier = getUpgradeTier(currentTier);
  if (!nextTier) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "var(--surface-overlay, rgba(0,0,0,0.6))" }}>
      <div className="card-base p-6 max-w-sm mx-4 text-center animate-fade-in">
        <div className="text-3xl mb-3">🔒</div>
        <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
          Upgrade to {getPlanLabel(nextTier)}
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          <strong>{feature}</strong> requires the {getPlanLabel(nextTier)} plan
          (${getPlanPrice(nextTier)}/mo).
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="primary" size="md">
            Upgrade Now
          </Button>
          {onClose && (
            <Button variant="ghost" size="md" onClick={onClose}>
              Maybe Later
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

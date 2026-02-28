"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { getPlanLabel, getPlanPrice, getUpgradeTier } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/plan-limits";
import type { Community } from "@/types/community";

type SettingsValues = Community["settings"];

type SettingsScreenProps = {
  community: Community | null;
  isMobile: boolean;
  isDark: boolean;
  onThemeToggle: () => void;
  onCommunityUpdate: () => void;
};

export function SettingsScreen({
  community,
  isMobile,
  isDark,
  onThemeToggle,
  onCommunityUpdate,
}: SettingsScreenProps) {
  const [saving, setSaving] = useState(false);
  const tier = (community?.plan_tier ?? "free") as PlanTier;
  const settings = community?.settings;
  const autoEnroll = settings?.auto_enroll_playbooks ?? true;
  const dailyDigest = settings?.daily_digest_email ?? true;

  const updateSetting = useCallback(
    async (key: string, value: boolean) => {
      if (!community) return;
      setSaving(true);
      try {
        await fetch("/api/community", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            community_id: community.id,
            settings: { ...(settings ?? {}), [key]: value },
          }),
        });
        onCommunityUpdate();
      } finally {
        setSaving(false);
      }
    },
    [community, settings, onCommunityUpdate]
  );

  if (!community) {
    return (
      <div className="card-base rounded-card p-8 text-center text-text-muted">
        <p className="text-sm">Loading settings...</p>
      </div>
    );
  }

  const integrations = [
    { name: "Whop API", connected: true, description: "Membership data, payments, user info" },
    {
      name: "Discord",
      connected: community.discord_bot_installed,
      description: "Message activity, engagement tracking",
    },
    {
      name: "Telegram",
      connected: community.telegram_bot_installed,
      description: "Chat engagement data",
    },
  ];

  const nextTier = getUpgradeTier(tier);

  return (
    <div className="animate-fade-in">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
      >
        <Card>
          <h3 className="font-heading text-sm font-bold text-text-primary mb-3">
            Integrations
          </h3>
          <div className="flex flex-col gap-2.5">
            {integrations.map((int) => (
              <div
                key={int.name}
                className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
              >
                <div>
                  <span className="text-sm font-semibold text-text-primary">{int.name}</span>
                  <p className="text-xs text-text-muted mt-0.5">{int.description}</p>
                </div>
                {int.connected ? (
                  <span className="text-xs font-semibold text-risk-low px-2 py-0.5 rounded-pill bg-risk-low/10">
                    Connected
                  </span>
                ) : (
                  <span className="text-xs text-text-muted px-2 py-0.5 rounded-pill bg-surface-input">
                    Not connected
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-heading text-sm font-bold text-text-primary mb-3">
            Preferences
          </h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">Auto-enroll members in playbooks</span>
              <Toggle on={autoEnroll} onToggle={() => updateSetting("auto_enroll_playbooks", !autoEnroll)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">Daily digest email</span>
              <Toggle on={dailyDigest} onToggle={() => updateSetting("daily_digest_email", !dailyDigest)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-primary">Dark mode</span>
              <Toggle on={isDark} onToggle={onThemeToggle} />
            </div>
          </div>
        </Card>

        <Card className={isMobile ? "" : "col-span-2"}>
          <h3 className="font-heading text-sm font-bold text-text-primary mb-3">
            Current Plan
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-heading text-2xl font-extrabold text-text-primary">
                {getPlanLabel(tier)}
              </span>
              <p className="text-xs text-text-muted mt-1">
                {getPlanPrice(tier) === 0
                  ? "Free — read-only dashboard"
                  : `$${getPlanPrice(tier)}/mo`}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {community.member_count} member{community.member_count === 1 ? "" : "s"} tracked
              </p>
            </div>
            {nextTier && (
              <Button variant="primary" size="sm">
                Upgrade to {getPlanLabel(nextTier)}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

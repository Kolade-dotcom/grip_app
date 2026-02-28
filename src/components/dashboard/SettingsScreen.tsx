"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { getPlanLabel, getPlanPrice, getUpgradeTier, PLAN_LIMITS } from "@/lib/plan-limits";
import type { PlanTier } from "@/lib/plan-limits";
import type { Community } from "@/types/community";

type SettingsScreenProps = {
  community: Community | null;
  isMobile: boolean;
  isDark: boolean;
  onThemeToggle: () => void;
  onCommunityUpdate: () => void;
  onManagePlan: () => void;
};

const CHANNELS = [
  { id: "email", label: "Email (always available)" },
  { id: "whop_chat", label: "Whop Chat" },
  { id: "discord", label: "Discord DM" },
  { id: "telegram", label: "Telegram" },
];

function getPlanFeatures(tier: PlanTier): string {
  const limits = PLAN_LIMITS[tier];
  const parts: string[] = [];
  if (limits.maxMembers === Infinity) parts.push("Unlimited members");
  else parts.push(`Up to ${limits.maxMembers.toLocaleString()} members`);
  if (limits.playbooks === Infinity) parts.push("All playbooks + custom builder");
  else if (limits.playbooks > 0) parts.push(`${limits.playbooks} automated playbook${limits.playbooks > 1 ? "s" : ""}`);
  else parts.push("Read-only dashboard");
  if (limits.aiPersonalization) parts.push("AI personalization");
  if (limits.abTesting) parts.push("A/B testing");
  return parts.join(" · ");
}

export function SettingsScreen({
  community,
  isMobile,
  isDark,
  onThemeToggle,
  onCommunityUpdate,
  onManagePlan,
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
    { name: "Whop API", connected: true, sub: "Syncing every 4h" },
    { name: "Discord Bot", connected: community.discord_bot_installed, sub: community.discord_bot_installed ? "Connected" : "Not connected" },
    { name: "Telegram Bot", connected: community.telegram_bot_installed, sub: community.telegram_bot_installed ? "Connected" : "Not connected" },
    { name: "Resend (Email)", connected: true, sub: `${community.member_count} members reachable` },
  ];

  const nextTier = getUpgradeTier(tier);

  return (
    <div className="animate-fade-in">
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}
      >
        {/* Integrations */}
        <Card>
          <h3 className="font-heading text-[13px] font-bold text-text-primary mb-4 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            Integrations
          </h3>
          <div className="flex flex-col">
            {integrations.map((int, i) => (
              <div
                key={int.name}
                className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < integrations.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <div>
                  <span className="text-xs font-semibold text-text-primary">{int.name}</span>
                  <p className="text-[10px] text-text-muted">{int.sub}</p>
                </div>
                {int.connected ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-risk-low/10 text-risk-low">
                    Connected
                  </span>
                ) : (
                  <Button variant="accent" size="xs">Connect</Button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Outreach Preferences */}
        <Card>
          <h3 className="font-heading text-[13px] font-bold text-text-primary mb-4 flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            Outreach Preferences
          </h3>

          <p className="text-[11px] text-text-muted mb-2.5">Channel priority:</p>
          <div className="flex flex-col gap-1">
            {CHANNELS.map((ch, i) => (
              <div
                key={ch.id}
                className="flex items-center gap-2 px-2.5 py-[7px] bg-surface-input rounded-[7px] text-xs text-text-primary"
              >
                <span className="text-text-muted font-bold text-[11px] w-4">{i + 1}</span>
                <span className="flex-1">{ch.label}</span>
                <span className="text-text-muted cursor-grab text-[10px]">⋮⋮</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-0">
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-medium text-text-primary">Auto-enroll playbooks</span>
                <p className="text-[10px] text-text-muted">Start when triggers are met</p>
              </div>
              <Toggle on={autoEnroll} onToggle={() => updateSetting("auto_enroll_playbooks", !autoEnroll)} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-xs font-medium text-text-primary">Daily digest email</span>
                <p className="text-[10px] text-text-muted">Morning summary of at-risk members</p>
              </div>
              <Toggle on={dailyDigest} onToggle={() => updateSetting("daily_digest_email", !dailyDigest)} />
            </div>
          </div>
        </Card>

        {/* Appearance */}
        <Card>
          <h3 className="font-heading text-[13px] font-bold text-text-primary mb-4">
            Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
              <span className="text-xs text-text-primary">{isDark ? "Dark Mode" : "Light Mode"}</span>
            </div>
            <Toggle on={isDark} onToggle={onThemeToggle} />
          </div>
        </Card>

        {/* Current Plan */}
        <Card
          className="border-accent/30"
          style={{
            background: isDark
              ? "linear-gradient(135deg, rgba(110,86,255,0.08), var(--bg-card))"
              : "linear-gradient(135deg, rgba(110,86,255,0.04), var(--bg-card))",
          }}
        >
          <p className="text-label mb-2">Current Plan</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-heading text-xl font-extrabold text-text-primary tracking-tight">
              {getPlanLabel(tier)}
            </span>
            <span className="text-[13px] font-medium text-text-secondary">
              {getPlanPrice(tier) === 0 ? "Free" : `$${getPlanPrice(tier)}/month`}
            </span>
          </div>
          <p className="text-xs text-text-secondary mb-3.5 leading-relaxed">
            {getPlanFeatures(tier)}
          </p>
          <div className="flex gap-2">
            {nextTier && (
              <Button variant="primary" size="sm" onClick={onManagePlan}>
                Upgrade to {getPlanLabel(nextTier)} (${getPlanPrice(nextTier)})
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onManagePlan}>Manage Billing</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

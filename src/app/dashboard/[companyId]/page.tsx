"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { TabBar, type TabId } from "@/components/layout/TabBar";
import { Footer } from "@/components/layout/Footer";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { DataSourcesBar } from "@/components/dashboard/DataSourcesBar";
import { MemberFilters, type FilterKey } from "@/components/dashboard/MemberFilters";
import { MemberList } from "@/components/dashboard/MemberList";
import type { MemberWithRisk } from "@/types/member";
import type { RiskLevel } from "@/types/risk";
import { formatCurrencyShort } from "@/lib/utils";

// ── Mock data for initial UI development ──
// Will be replaced with real API calls in later phases.
const MOCK_MEMBERS: MemberWithRisk[] = [
  { id: "1", community_id: "c1", whop_membership_id: "wm1", whop_user_id: "wu1", email: "jake@email.com", username: "Jake1987", first_name: "Jake", subscription_status: "active", plan_id: "p1", plan_name: "Premium", plan_price_cents: 19900, current_period_start: "2026-02-01T00:00:00Z", current_period_end: "2026-03-08T00:00:00Z", cancel_at_period_end: true, ltv_cents: 159200, tenure_days: 240, previous_cancellations: 0, recent_payment_failures: 1, discord_user_id: null, telegram_user_id: null, has_engagement_data: true, created_at: "2025-06-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z", risk_score: 87, risk_level: "critical", data_confidence: "high" },
  { id: "2", community_id: "c1", whop_membership_id: "wm2", whop_user_id: "wu2", email: "sarah@email.com", username: "Sarah_T", first_name: "Sarah", subscription_status: "active", plan_id: "p2", plan_name: "Basic", plan_price_cents: 9900, current_period_start: "2026-02-01T00:00:00Z", current_period_end: "2026-03-12T00:00:00Z", cancel_at_period_end: false, ltv_cents: 39800, tenure_days: 90, previous_cancellations: 0, recent_payment_failures: 0, discord_user_id: null, telegram_user_id: null, has_engagement_data: false, created_at: "2025-11-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z", risk_score: 82, risk_level: "critical", data_confidence: "low" },
  { id: "3", community_id: "c1", whop_membership_id: "wm3", whop_user_id: "wu3", email: "mike@email.com", username: "Mike_Crypto", first_name: "Mike", subscription_status: "active", plan_id: "p1", plan_name: "Premium", plan_price_cents: 19900, current_period_start: "2026-02-01T00:00:00Z", current_period_end: "2026-03-22T00:00:00Z", cancel_at_period_end: false, ltv_cents: 298500, tenure_days: 420, previous_cancellations: 0, recent_payment_failures: 0, discord_user_id: "d3", telegram_user_id: null, has_engagement_data: true, created_at: "2024-06-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z", risk_score: 58, risk_level: "high", data_confidence: "high" },
  { id: "4", community_id: "c1", whop_membership_id: "wm4", whop_user_id: "wu4", email: "tpro@email.com", username: "TradingPro", first_name: null, subscription_status: "active", plan_id: "p1", plan_name: "Premium", plan_price_cents: 19900, current_period_start: "2026-02-01T00:00:00Z", current_period_end: "2026-03-18T00:00:00Z", cancel_at_period_end: false, ltv_cents: 119400, tenure_days: 180, previous_cancellations: 0, recent_payment_failures: 0, discord_user_id: "d4", telegram_user_id: null, has_engagement_data: true, created_at: "2025-08-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z", risk_score: 52, risk_level: "high", data_confidence: "high" },
  { id: "5", community_id: "c1", whop_membership_id: "wm5", whop_user_id: "wu5", email: "cking@email.com", username: "CryptoKing", first_name: null, subscription_status: "active", plan_id: "p2", plan_name: "Basic", plan_price_cents: 9900, current_period_start: "2026-02-01T00:00:00Z", current_period_end: "2026-03-25T00:00:00Z", cancel_at_period_end: false, ltv_cents: 79600, tenure_days: 120, previous_cancellations: 1, recent_payment_failures: 0, discord_user_id: null, telegram_user_id: null, has_engagement_data: true, created_at: "2025-10-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z", risk_score: 45, risk_level: "high", data_confidence: "high" },
  { id: "6", community_id: "c1", whop_membership_id: "wm6", whop_user_id: "wu6", email: "alex@email.com", username: "Alex_Wins", first_name: "Alex", subscription_status: "active", plan_id: "p3", plan_name: "VIP", plan_price_cents: 49900, current_period_start: "2026-02-01T00:00:00Z", current_period_end: "2026-04-15T00:00:00Z", cancel_at_period_end: false, ltv_cents: 420000, tenure_days: 660, previous_cancellations: 0, recent_payment_failures: 0, discord_user_id: "d6", telegram_user_id: null, has_engagement_data: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z", risk_score: 12, risk_level: "low", data_confidence: "high" },
  { id: "7", community_id: "c1", whop_membership_id: "wm7", whop_user_id: "wu7", email: "bet@email.com", username: "BetMaster", first_name: null, subscription_status: "active", plan_id: "p1", plan_name: "Premium", plan_price_cents: 19900, current_period_start: "2026-02-01T00:00:00Z", current_period_end: "2026-03-30T00:00:00Z", cancel_at_period_end: false, ltv_cents: 358200, tenure_days: 600, previous_cancellations: 0, recent_payment_failures: 0, discord_user_id: "d7", telegram_user_id: null, has_engagement_data: true, created_at: "2024-02-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z", risk_score: 8, risk_level: "low", data_confidence: "high" },
  { id: "8", community_id: "c1", whop_membership_id: "wm8", whop_user_id: "wu8", email: "new22@email.com", username: "NewTrader22", first_name: null, subscription_status: "active", plan_id: "p2", plan_name: "Basic", plan_price_cents: 9900, current_period_start: "2026-02-01T00:00:00Z", current_period_end: "2026-03-26T00:00:00Z", cancel_at_period_end: false, ltv_cents: 9900, tenure_days: 30, previous_cancellations: 0, recent_payment_failures: 0, discord_user_id: null, telegram_user_id: null, has_engagement_data: false, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-02-01T00:00:00Z", risk_score: 35, risk_level: "medium", data_confidence: "low" },
];

const DATA_SOURCES = [
  { name: "Whop API", connected: true },
  { name: "Discord", connected: true },
  { name: "Telegram", connected: false },
];

export default function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [isDark, setIsDark] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive: measure container width (iFrame-aware, not window)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsMobile(entry.contentRect.width < 640);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Theme toggle
  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      document.documentElement.classList.toggle("light", prev);
      return !prev;
    });
  }, []);

  // Member click → future: navigate to member detail
  const handleMemberClick = useCallback((memberId: string) => {
    // TODO: Navigate to member detail screen
    console.log("Navigate to member:", memberId);
  }, []);

  // Compute filter counts
  const counts: Record<FilterKey, number> = {
    all: MOCK_MEMBERS.length,
    critical: MOCK_MEMBERS.filter((m) => m.risk_level === "critical").length,
    high: MOCK_MEMBERS.filter((m) => m.risk_level === "high").length,
    medium: MOCK_MEMBERS.filter((m) => m.risk_level === "medium").length,
    low: MOCK_MEMBERS.filter((m) => m.risk_level === "low").length,
  };

  const filteredMembers =
    filter === "all"
      ? MOCK_MEMBERS
      : MOCK_MEMBERS.filter((m) => m.risk_level === filter);

  // Revenue at risk: sum LTV of critical + high members
  const revenueAtRisk = MOCK_MEMBERS
    .filter((m) => m.risk_level === "critical" || m.risk_level === "high")
    .reduce((sum, m) => sum + m.ltv_cents, 0);

  return (
    <div ref={containerRef} className="min-h-screen bg-surface-bg transition-colors duration-300">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-surface-raised border-b border-border">
        <TopNav
          communityName="Crypto Alpha"
          memberCount={847}
          onThemeToggle={toggleTheme}
          isDark={isDark}
          isMobile={isMobile}
        />
        <TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          criticalCount={counts.critical + counts.high}
          isMobile={isMobile}
        />
      </div>

      {/* Content */}
      <div
        className="max-w-app mx-auto animate-fade-in"
        style={{ padding: isMobile ? "16px 12px" : "20px 20px" }}
      >
        {activeTab === "dashboard" && (
          <>
            <StatsRow
              revenueAtRisk={formatCurrencyShort(revenueAtRisk)}
              criticalCount={counts.critical}
              highCount={counts.high}
              inPlaybooks={43}
              playbooksRunning={3}
              isMobile={isMobile}
            />
            <DataSourcesBar sources={DATA_SOURCES} />
            <MemberFilters
              activeFilter={filter}
              onFilterChange={setFilter}
              counts={counts}
            />
            <MemberList
              members={filteredMembers}
              onMemberClick={handleMemberClick}
              isMobile={isMobile}
            />
          </>
        )}

        {activeTab === "playbooks" && (
          <div className="card-base rounded-card p-8 text-center text-text-muted">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-heading text-lg font-bold text-text-primary mb-2">Playbooks</h3>
            <p className="text-sm">Automated retention workflows — coming in Phase 9.</p>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="card-base rounded-card p-8 text-center text-text-muted">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-heading text-lg font-bold text-text-primary mb-2">Analytics</h3>
            <p className="text-sm">Risk distribution and impact metrics — coming in Phase 8.</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="card-base rounded-card p-8 text-center text-text-muted">
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="font-heading text-lg font-bold text-text-primary mb-2">Settings</h3>
            <p className="text-sm">Integrations and preferences — coming in Phase 7.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer planLabel="Growth" />
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import { TabBar, type TabId } from "@/components/layout/TabBar";
import { Footer } from "@/components/layout/Footer";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { DataSourcesBar } from "@/components/dashboard/DataSourcesBar";
import { MemberFilters, type FilterKey } from "@/components/dashboard/MemberFilters";
import { MemberSearch } from "@/components/dashboard/MemberSearch";
import { MemberList } from "@/components/dashboard/MemberList";
import { useMembers } from "@/hooks/useMembers";
import { useCommunity } from "@/hooks/useCommunity";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatCurrencyShort } from "@/lib/utils";

export default function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [isDark, setIsDark] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch community data
  const { community, loading: communityLoading, error: communityError, refetch: refetchCommunity } = useCommunity(companyId);

  // Fetch members with risk scores and search
  const {
    members,
    loading: membersLoading,
    counts,
    syncing,
    triggerSync,
  } = useMembers({
    communityId: community?.id ?? "",
    riskLevel: filter === "all" ? "all" : filter,
    search: search || undefined,
  });

  // Fetch dashboard stats (playbook counts, last sync time)
  const { stats, refetch: refetchStats } = useDashboardStats(community?.id ?? "");

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

  // Member click → navigate to member detail
  const handleMemberClick = useCallback(
    (memberId: string) => {
      router.push(`/dashboard/${companyId}/members/${memberId}`);
    },
    [router, companyId]
  );

  // Sync handler — sync then refresh stats
  const handleSync = useCallback(async () => {
    await triggerSync();
    refetchStats();
  }, [triggerSync, refetchStats]);

  // Revenue at risk: sum LTV of critical + high members (from allMembers via counts)
  const revenueAtRisk = members
    .filter((m) => m.risk_level === "critical" || m.risk_level === "high")
    .reduce((sum, m) => sum + m.ltv_cents, 0);

  const loading = communityLoading || membersLoading;

  return (
    <div ref={containerRef} className="min-h-screen bg-surface-bg transition-colors duration-300">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-surface-raised border-b border-border">
        <TopNav
          communityName={community?.name ?? "Loading..."}
          memberCount={community?.member_count ?? 0}
          syncedAgo={syncing ? "syncing..." : stats.lastSyncedAgo ?? "never"}
          syncing={syncing}
          onSync={handleSync}
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
        {/* Error state — community failed to load */}
        {communityError && !communityLoading && (
          <div className="card-base rounded-card p-8 text-center text-text-muted mb-4">
            <div className="text-3xl mb-3">⚠️</div>
            <h3 className="font-heading text-lg font-bold text-text-primary mb-2">
              Could not load community
            </h3>
            <p className="text-sm mb-4">{communityError}</p>
            <button
              onClick={refetchCommunity}
              className="px-4 py-2 rounded-btn bg-accent text-white text-sm font-semibold cursor-pointer border-none hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        )}

        {activeTab === "dashboard" && (
          <>
            <StatsRow
              revenueAtRisk={formatCurrencyShort(revenueAtRisk)}
              criticalCount={counts.critical}
              highCount={counts.high}
              inPlaybooks={stats.inPlaybooks}
              playbooksRunning={stats.playbooksRunning}
              isMobile={isMobile}
            />
            <DataSourcesBar
              sources={[
                { name: "Whop API", connected: true },
                { name: "Discord", connected: community?.discord_bot_installed ?? false },
                { name: "Telegram", connected: community?.telegram_bot_installed ?? false },
              ]}
            />
            <div className="flex items-center gap-2.5 mb-2.5">
              <MemberFilters
                activeFilter={filter}
                onFilterChange={setFilter}
                counts={counts}
              />
              <div className="flex-1" />
              {!isMobile && (
                <div className="w-56">
                  <MemberSearch value={search} onChange={setSearch} />
                </div>
              )}
            </div>
            {isMobile && (
              <div className="mb-2.5">
                <MemberSearch value={search} onChange={setSearch} />
              </div>
            )}
            {loading ? (
              <div className="card-base rounded-card p-8 text-center text-text-muted">
                <p className="text-sm">Loading members...</p>
              </div>
            ) : members.length === 0 && !search ? (
              <div className="card-base rounded-card p-8 text-center text-text-muted">
                <div className="text-3xl mb-3">📡</div>
                <h3 className="font-heading text-lg font-bold text-text-primary mb-2">No members yet</h3>
                <p className="text-sm mb-4">Sync your Whop data to get started with risk scoring.</p>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="px-4 py-2 rounded-btn bg-accent text-white text-sm font-semibold cursor-pointer border-none hover:opacity-90 disabled:opacity-50"
                >
                  {syncing ? "Syncing..." : "Sync from Whop"}
                </button>
              </div>
            ) : members.length === 0 && search ? (
              <div className="card-base rounded-card p-8 text-center text-text-muted">
                <p className="text-sm">No members match &ldquo;{search}&rdquo;</p>
              </div>
            ) : (
              <MemberList
                members={members}
                onMemberClick={handleMemberClick}
                isMobile={isMobile}
              />
            )}
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
      <Footer planLabel={community?.plan_tier ?? "free"} />
    </div>
  );
}

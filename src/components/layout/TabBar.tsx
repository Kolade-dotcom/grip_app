"use client";

import { cn } from "@/lib/utils";

export type TabId = "dashboard" | "playbooks" | "analytics" | "settings";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  criticalCount?: number;
  isMobile: boolean;
}

const HomeIcon = (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ZapIcon = (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const BarIcon = (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);

const GearIcon = (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export function TabBar({ activeTab, onTabChange, criticalCount, isMobile }: TabBarProps) {
  const tabs: Tab[] = [
    { id: "dashboard", label: "Dashboard", icon: HomeIcon, badge: criticalCount },
    { id: "playbooks", label: "Playbooks", icon: ZapIcon },
    { id: "analytics", label: "Analytics", icon: BarIcon },
    { id: "settings", label: "Settings", icon: GearIcon },
  ];

  return (
    <div
      className="flex overflow-x-auto max-w-app mx-auto w-full"
      style={{ padding: isMobile ? "0 8px" : "0 20px" }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 bg-transparent border-none cursor-pointer transition-all duration-150 whitespace-nowrap font-body",
              isActive
                ? "font-semibold text-accent-text border-b-accent"
                : "font-medium text-text-muted border-b-transparent hover:text-text-secondary",
            )}
            style={{
              padding: isMobile ? "8px 12px" : "8px 16px",
              fontSize: 12,
              borderBottom: `2px solid ${isActive ? "#6e56ff" : "transparent"}`,
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-[1px] rounded-[5px] bg-risk-critical-bg text-risk-critical">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

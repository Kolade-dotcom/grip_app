"use client";

import { GripLogo, GripWordmark } from "@/components/GripLogo";
import { Button } from "@/components/ui/Button";

interface TopNavProps {
  communityName: string;
  memberCount: number;
  syncedAgo?: string;
  onThemeToggle: () => void;
  isDark: boolean;
  isMobile: boolean;
}

export function TopNav({
  communityName,
  memberCount,
  syncedAgo = "2m ago",
  onThemeToggle,
  isDark,
  isMobile,
}: TopNavProps) {
  const abbreviation = communityName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-2.5 px-5 py-2.5 max-w-app mx-auto w-full" style={isMobile ? { padding: "10px 14px" } : undefined}>
      {/* Logo */}
      <GripLogo size={26} />
      {!isMobile && <GripWordmark />}

      {/* Divider */}
      <div className="w-px h-5 bg-border flex-shrink-0" />

      {/* Community picker */}
      <button className="flex items-center gap-1.5 bg-accent-subtle rounded-[7px] px-2.5 py-1 border-none cursor-pointer">
        <span className="text-xs font-semibold text-text-primary">
          {isMobile ? abbreviation : communityName}
        </span>
        <span className="text-[10px] text-text-muted">{memberCount}</span>
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sync status */}
      <span className="text-[10px] text-text-muted hidden sm:inline">
        Synced {syncedAgo}
      </span>

      {/* Theme toggle */}
      <button
        onClick={onThemeToggle}
        className="flex items-center justify-center w-[30px] h-[30px] rounded-[7px] bg-surface-input border border-border cursor-pointer transition-colors hover:border-border-hover"
      >
        {isDark ? (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </button>

      {/* Notifications */}
      <button className="relative flex items-center justify-center w-[30px] h-[30px] rounded-[7px] bg-surface-input border border-border cursor-pointer transition-colors hover:border-border-hover">
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-risk-critical border-2 border-surface-raised" />
      </button>
    </div>
  );
}

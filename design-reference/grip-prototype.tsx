import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════
// GRIP — Retention Engine for Whop Communities
// Premium Interactive Prototype (Growth Plan View)
// ═══════════════════════════════════════════════════════

const THEMES = {
  dark: {
    bg: "#09090b",
    bgRaised: "#111114",
    bgCard: "#16161a",
    bgCardHover: "#1c1c22",
    bgInput: "#111114",
    bgOverlay: "rgba(0,0,0,0.6)",
    bgAccentSubtle: "rgba(110,86,255,0.08)",
    bgAccentMid: "rgba(110,86,255,0.14)",
    border: "rgba(255,255,255,0.06)",
    borderHover: "rgba(255,255,255,0.1)",
    borderAccent: "rgba(110,86,255,0.3)",
    text: "#f0f0f3",
    textSecondary: "#8d8d9b",
    textMuted: "#55555f",
    accent: "#6e56ff",
    accentHover: "#7f6aff",
    accentText: "#b4a4ff",
    accentGlow: "rgba(110,86,255,0.25)",
    critical: "#ff4757",
    criticalBg: "rgba(255,71,87,0.1)",
    criticalBorder: "rgba(255,71,87,0.2)",
    high: "#ffa502",
    highBg: "rgba(255,165,2,0.1)",
    highBorder: "rgba(255,165,2,0.2)",
    medium: "#3b82f6",
    mediumBg: "rgba(59,130,246,0.1)",
    low: "#2ed573",
    lowBg: "rgba(46,213,115,0.1)",
    success: "#2ed573",
    successBg: "rgba(46,213,115,0.1)",
    shadow: "0 1px 3px rgba(0,0,0,0.4)",
    shadowLg: "0 8px 32px rgba(0,0,0,0.5)",
    gradientCard: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)",
    gradientAccent: "linear-gradient(135deg, #6e56ff 0%, #a855f7 50%, #6e56ff 100%)",
    noise: 0.03,
  },
  light: {
    bg: "#f8f8fa",
    bgRaised: "#ffffff",
    bgCard: "#ffffff",
    bgCardHover: "#f5f5f8",
    bgInput: "#f0f0f4",
    bgOverlay: "rgba(0,0,0,0.3)",
    bgAccentSubtle: "rgba(110,86,255,0.04)",
    bgAccentMid: "rgba(110,86,255,0.08)",
    border: "rgba(0,0,0,0.07)",
    borderHover: "rgba(0,0,0,0.12)",
    borderAccent: "rgba(110,86,255,0.2)",
    text: "#111114",
    textSecondary: "#6b6b78",
    textMuted: "#9d9daa",
    accent: "#6e56ff",
    accentHover: "#5a42e8",
    accentText: "#6e56ff",
    accentGlow: "rgba(110,86,255,0.12)",
    critical: "#e83e52",
    criticalBg: "rgba(232,62,82,0.07)",
    criticalBorder: "rgba(232,62,82,0.15)",
    high: "#d4890a",
    highBg: "rgba(212,137,10,0.07)",
    highBorder: "rgba(212,137,10,0.15)",
    medium: "#2563eb",
    mediumBg: "rgba(37,99,235,0.07)",
    low: "#16a34a",
    lowBg: "rgba(22,163,74,0.07)",
    success: "#16a34a",
    successBg: "rgba(22,163,74,0.07)",
    shadow: "0 1px 3px rgba(0,0,0,0.06)",
    shadowLg: "0 8px 32px rgba(0,0,0,0.08)",
    gradientCard: "linear-gradient(135deg, rgba(0,0,0,0.01) 0%, rgba(0,0,0,0) 100%)",
    gradientAccent: "linear-gradient(135deg, #6e56ff 0%, #a855f7 50%, #6e56ff 100%)",
    noise: 0,
  },
};

// ─── MOCK DATA ───
const MEMBERS = [
  { id: 1, name: "Jake1987", initials: "JK", risk: 87, level: "critical", engagement: 12, lastSeen: "6d ago", renewal: "8 days", ltv: 1592, plan: "Premium", price: 199, since: "Apr 2024", tenure: "8mo", failures: 1, cancelScheduled: true, factors: ["Cancellation scheduled", "Payment failed Dec 14", "Renewal in 8 days", "Silent 6 days (avg 12 msgs/wk)"], playbook: "Renewal Risk — Step 2/5", email: "jake@email.com" },
  { id: 2, name: "Sarah_T", initials: "ST", risk: 82, level: "critical", engagement: 8, lastSeen: "4d ago", renewal: "12 days", ltv: 398, plan: "Basic", price: 99, since: "Nov 2025", tenure: "3mo", failures: 0, cancelScheduled: false, factors: ["First renewal approaching", "No engagement data", "New member risk window"], playbook: null, email: "sarah@email.com" },
  { id: 3, name: "Mike_Crypto", initials: "MC", risk: 58, level: "high", engagement: 34, lastSeen: "2d ago", renewal: "22 days", ltv: 2985, plan: "Premium", price: 199, since: "Jun 2024", tenure: "14mo", failures: 0, cancelScheduled: false, factors: ["Engagement dropped 45%", "High-LTV at risk"], playbook: "Silent Revival — Step 1/5", email: "mike@email.com" },
  { id: 4, name: "TradingPro", initials: "TP", risk: 52, level: "high", engagement: 41, lastSeen: "3d ago", renewal: "18 days", ltv: 1194, plan: "Premium", price: 199, since: "Aug 2025", tenure: "6mo", failures: 0, cancelScheduled: false, factors: ["Declining 3 consecutive weeks", "Renewal in 18 days"], playbook: null, email: "tpro@email.com" },
  { id: 5, name: "CryptoKing", initials: "CK", risk: 45, level: "high", engagement: 38, lastSeen: "1d ago", renewal: "25 days", ltv: 796, plan: "Basic", price: 99, since: "Oct 2025", tenure: "4mo", failures: 0, cancelScheduled: false, factors: ["Below baseline engagement", "Previously cancelled 1x"], playbook: null, email: "cking@email.com" },
  { id: 6, name: "Alex_Wins", initials: "AW", risk: 12, level: "low", engagement: 89, lastSeen: "2h ago", renewal: "45 days", ltv: 4200, plan: "VIP", price: 499, since: "Jan 2024", tenure: "22mo", failures: 0, cancelScheduled: false, factors: [], playbook: null, email: "alex@email.com", upsell: true },
  { id: 7, name: "BetMaster", initials: "BM", risk: 8, level: "low", engagement: 92, lastSeen: "1h ago", renewal: "30 days", ltv: 3582, plan: "Premium", price: 199, since: "Feb 2024", tenure: "20mo", failures: 0, cancelScheduled: false, factors: [], playbook: null, email: "bet@email.com" },
  { id: 8, name: "NewTrader22", initials: "NT", risk: 35, level: "medium", engagement: 22, lastSeen: "5d ago", renewal: "26 days", ltv: 99, plan: "Basic", price: 99, since: "Jan 2026", tenure: "1mo", failures: 0, cancelScheduled: false, factors: ["Onboarding window", "Low first-month engagement"], playbook: "Fast Start — Day 7", email: "new22@email.com" },
];

const PLAYBOOKS = [
  { id: 1, name: "Silent Member Revival", emoji: "🔄", desc: "Re-engage members who've gone quiet 7+ days", enrolled: 23, rate: 48, saved: "$6,200", recentWin: "Mike_Crypto re-engaged after Day 3", steps: [{ n: "Check-in Email", sent: 23, opened: 19 }, { n: "Value Highlight", sent: 19, opened: 14 }, { n: "Community Invite", sent: 14, clicked: 8 }, { n: "Direct Question", sent: 6, resp: 3 }, { n: "Creator Escalation", sent: 3, acted: 2 }] },
  { id: 2, name: "New Member Fast Start", emoji: "🚀", desc: "Guided onboarding for first 30 days", enrolled: 12, rate: 83, saved: "$3,400", recentWin: "NewTrader22 completed onboarding Day 5", steps: [{ n: "Welcome Email", sent: 12, opened: 11 }, { n: "Goal Setting", sent: 11, done: 9 }, { n: "Progress Check", sent: 9, engaged: 7 }, { n: "Week 1 Milestone", sent: 7, hit: 6 }, { n: "Pre-Renewal Prep", sent: 4, conv: 3 }] },
  { id: 3, name: "Renewal Risk Mitigation", emoji: "🛡️", desc: "Prevent cancellations around renewal dates", enrolled: 8, rate: 38, saved: "$8,850", recentWin: "Jake1987 opened value reminder", steps: [{ n: "Value Reminder", sent: 8, opened: 6 }, { n: "Satisfaction Check", sent: 6, resp: 4 }, { n: "Address Concerns", sent: 2, resolved: 1 }, { n: "ROI Showcase", sent: 4, clicked: 3 }, { n: "Final Offer", sent: 2, accepted: 1 }] },
];

// ─── LOGO SVG ───
const GripLogo = ({ size = 28, theme }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <defs>
      <linearGradient id="gripGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6e56ff" />
        <stop offset="50%" stopColor="#9b6dff" />
        <stop offset="100%" stopColor="#6e56ff" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="10" fill="url(#gripGrad)" />
    {/* Abstract "G" formed by two interlocking arcs — represents grip/retention */}
    <path d="M20 10c-5.52 0-10 4.48-10 10s4.48 10 10 10c3.5 0 6.58-1.8 8.37-4.52" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.95" />
    <path d="M28 20h-8" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity="0.95" />
    <path d="M20 20v-4" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" opacity="0.6" />
    <circle cx="28.2" cy="15" r="2" fill="#fff" opacity="0.7" />
  </svg>
);

const GripWordmark = ({ theme }) => (
  <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.04em", color: theme.text, fontFamily: "'Outfit', sans-serif" }}>
    Grip
  </span>
);

// ─── ICONS ───
const Ico = ({ d, size = 16, color, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const ICO = {
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  bar: <><path d="M18 20V10M12 20V4M6 20v-6"/></>,
  gear: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
  mail: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  back: <><polyline points="15 18 9 12 15 6"/></>,
  sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  moon: <><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></>,
  link: <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
  alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
  user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  ext: <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></>,
  bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
  chevDown: <><polyline points="6 9 12 15 18 9"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  sparkle: <><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/></>,
  send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
};

// ─── COMPONENTS ───
const RiskColor = (level, theme) => ({
  critical: { c: theme.critical, bg: theme.criticalBg, border: theme.criticalBorder },
  high: { c: theme.high, bg: theme.highBg, border: theme.highBorder },
  medium: { c: theme.medium, bg: theme.mediumBg, border: "transparent" },
  low: { c: theme.low, bg: theme.lowBg, border: "transparent" },
}[level] || { c: theme.textMuted, bg: "transparent", border: "transparent" });

const Pill = ({ children, c, bg, style: s }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 650,
    color: c, background: bg, letterSpacing: "0.01em", lineHeight: 1, whiteSpace: "nowrap", ...s,
  }}>{children}</span>
);

const RiskPill = ({ level, theme }) => {
  const r = RiskColor(level, theme);
  return <Pill c={r.c} bg={r.bg}>{level.charAt(0).toUpperCase() + level.slice(1)}</Pill>;
};

const Dot = ({ color, size = 7 }) => (
  <span style={{ width: size, height: size, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
);

const Btn = ({ children, variant = "default", size = "sm", onClick, disabled, style: s, theme }) => {
  const t = theme;
  const variants = {
    default: { bg: t.bgRaised, color: t.text, border: `1px solid ${t.border}` },
    primary: { bg: t.accent, color: "#fff", border: "none" },
    ghost: { bg: "transparent", color: t.textSecondary, border: "none" },
    danger: { bg: t.criticalBg, color: t.critical, border: `1px solid ${t.criticalBorder}` },
    success: { bg: t.successBg, color: t.success, border: "none" },
    accent: { bg: t.bgAccentSubtle, color: t.accentText, border: `1px solid ${t.borderAccent}` },
  };
  const sizes = { xs: { p: "4px 8px", fs: 11 }, sm: { p: "6px 12px", fs: 12 }, md: { p: "8px 16px", fs: 13 }, lg: { p: "10px 20px", fs: 13 } };
  const v = variants[variant]; const sz = sizes[size];
  return (
    <button disabled={disabled} onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 8,
      padding: sz.p, fontSize: sz.fs, fontWeight: 600, fontFamily: "inherit",
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
      transition: "all 0.15s", letterSpacing: "0.005em",
      background: v.bg, color: v.color, border: v.border, boxShadow: variant === "primary" ? `0 1px 8px ${t.accentGlow}` : "none", ...s,
    }}>{children}</button>
  );
};

const Card = ({ children, theme, style: s, hover, onClick }) => (
  <div onClick={onClick} style={{
    background: theme.bgCard, border: `1px solid ${theme.border}`,
    borderRadius: 12, overflow: "hidden",
    boxShadow: theme.shadow, transition: "all 0.2s",
    cursor: onClick ? "pointer" : "default", ...s,
  }}>{children}</div>
);

const StatBlock = ({ label, value, sub, accent, theme }) => (
  <div style={{ padding: "16px 18px", background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, flex: 1, minWidth: 0 }}>
    <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 800, color: accent || theme.text, letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "'Outfit', sans-serif" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: theme.textSecondary, marginTop: 6, lineHeight: 1.3 }}>{sub}</div>}
  </div>
);

const ProgressBar = ({ value, max = 100, color, theme, h = 5 }) => (
  <div style={{ width: "100%", height: h, background: theme.bgInput, borderRadius: h }}>
    <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: "100%", background: color || theme.accent, borderRadius: h, transition: "width 0.5s ease" }} />
  </div>
);

const Toggle = ({ on, onToggle, theme }) => (
  <button onClick={onToggle} style={{
    width: 36, height: 20, borderRadius: 10, border: "none", padding: 2, cursor: "pointer",
    background: on ? theme.accent : theme.bgInput, transition: "background 0.2s",
    display: "flex", alignItems: "center",
  }}>
    <div style={{
      width: 16, height: 16, borderRadius: 8, background: "#fff",
      transform: on ? "translateX(16px)" : "translateX(0)",
      transition: "transform 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    }} />
  </button>
);

const EngChart = ({ data, theme }) => {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 52 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{
            width: "100%", maxWidth: 22, borderRadius: 3,
            height: `${Math.max((d.v / max) * 44, 2)}px`,
            background: i >= data.length - 2
              ? theme.accent
              : i >= data.length - 4
                ? theme.bgAccentMid
                : theme.bgAccentSubtle,
            transition: "height 0.4s ease",
          }} />
          <span style={{ fontSize: 8, color: theme.textMuted }}>{d.l}</span>
        </div>
      ))}
    </div>
  );
};

// ─── SCREENS ───

// DASHBOARD
const Dashboard = ({ theme, onMember, isMobile }) => {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? MEMBERS : MEMBERS.filter(m => m.level === filter);
  const crit = MEMBERS.filter(m => m.level === "critical").length;
  const high = MEMBERS.filter(m => m.level === "high").length;

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        <StatBlock label="Revenue at Risk" value="$8,420" sub="23 critical + high risk" accent={theme.critical} theme={theme} />
        <StatBlock label="Critical" value={crit} sub="Act now" accent={theme.critical} theme={theme} />
        <StatBlock label="High Risk" value={high} sub="Recommend intervention" accent={theme.high} theme={theme} />
        <StatBlock label="In Playbooks" value="43" sub="3 playbooks running" accent={theme.accent} theme={theme} />
      </div>

      {/* Data sources bar */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, padding: "10px 14px", background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 10, marginBottom: 18, fontSize: 12 }}>
        <span style={{ color: theme.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sources</span>
        {[{ n: "Whop API", on: true }, { n: "Discord", on: true }, { n: "Telegram", on: false }].map((s, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 5, color: s.on ? theme.success : theme.textMuted }}>
            <Dot color={s.on ? theme.success : theme.textMuted} size={5} /> {s.n}
          </span>
        ))}
        <Btn variant="ghost" size="xs" theme={theme} style={{ marginLeft: "auto" }}>+ Connect Telegram</Btn>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
        {[
          { k: "all", l: `All (${MEMBERS.length})` },
          { k: "critical", l: `Critical (${crit})`, ac: theme.critical },
          { k: "high", l: `High (${high})`, ac: theme.high },
          { k: "medium", l: "Medium (1)" },
          { k: "low", l: "Low (2)" },
        ].map(t => (
          <button key={t.k} onClick={() => setFilter(t.k)} style={{
            padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer",
            fontSize: 11, fontWeight: 600, fontFamily: "inherit",
            background: filter === t.k ? (t.ac ? `${t.ac}18` : theme.bgAccentMid) : "transparent",
            color: filter === t.k ? (t.ac || theme.accentText) : theme.textMuted,
            transition: "all 0.15s",
          }}>{t.l}</button>
        ))}
      </div>

      {/* Member list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {/* Header */}
        {!isMobile && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 70px 70px 150px", gap: 12, padding: "6px 16px", fontSize: 10, fontWeight: 600, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            <span>Member</span><span style={{ textAlign: "center" }}>Risk</span><span style={{ textAlign: "center" }}>Renewal</span><span style={{ textAlign: "center" }}>LTV</span><span style={{ textAlign: "right" }}>Actions</span>
          </div>
        )}
        {filtered.map((m, idx) => {
          const rc = RiskColor(m.level, theme);
          return (
            <div key={m.id} onClick={() => onMember(m)} style={{
              display: isMobile ? "flex" : "grid",
              gridTemplateColumns: isMobile ? undefined : "1fr 70px 70px 70px 150px",
              flexDirection: isMobile ? "column" : undefined,
              gap: isMobile ? 8 : 12, alignItems: isMobile ? "stretch" : "center",
              padding: isMobile ? "12px 14px" : "11px 16px", borderRadius: 10,
              background: theme.bgCard, border: `1px solid ${theme.border}`,
              cursor: "pointer", transition: "all 0.15s",
              marginBottom: 2,
              animation: `fadeSlideIn 0.3s ease ${idx * 0.03}s both`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <div style={{ position: "relative" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `linear-gradient(135deg, ${rc.c}30, ${rc.c}10)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: rc.c, letterSpacing: "-0.02em",
                  }}>{m.initials}</div>
                  <Dot color={rc.c} size={6} style={{ position: "absolute", top: -1, right: -1, border: `2px solid ${theme.bgCard}` }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 650, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: theme.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.playbook || m.factors[0] || "Healthy"}
                  </div>
                </div>
              </div>
              {isMobile ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <RiskPill level={m.level} theme={theme} />
                    <span style={{ fontSize: 11, color: theme.textMuted }}>Renews {m.renewal}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>${m.ltv.toLocaleString()}</span>
                </div>
              ) : (
                <>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: rc.c, fontFamily: "'Outfit', sans-serif" }}>{m.risk}</span>
                  </div>
                  <div style={{ textAlign: "center", fontSize: 12, color: theme.textSecondary, fontWeight: 500 }}>{m.renewal}</div>
                  <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: theme.text, fontFamily: "'Outfit', sans-serif" }}>${m.ltv.toLocaleString()}</div>
                  <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                    {m.level === "critical" || m.level === "high" ? (
                      <>
                        <Btn variant="accent" size="xs" theme={theme}><Ico d={ICO.play} size={10} /> Playbook</Btn>
                        <Btn variant="default" size="xs" theme={theme}><Ico d={ICO.mail} size={10} /></Btn>
                      </>
                    ) : m.upsell ? (
                      <Btn variant="success" size="xs" theme={theme}>VIP Offer</Btn>
                    ) : (
                      <Btn variant="ghost" size="xs" theme={theme}>View</Btn>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// MEMBER DETAIL
const MemberDetail = ({ member: m, theme, onBack, isMobile }) => {
  const rc = RiskColor(m.level, theme);
  const chartData = [
    { l: "W1", v: 45 }, { l: "W2", v: 52 }, { l: "W3", v: 48 }, { l: "W4", v: 41 },
    { l: "W5", v: 38 }, { l: "W6", v: 29 }, { l: "W7", v: 14 }, { l: "W8", v: 3 },
  ];
  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}>
          <Ico d={ICO.back} size={16} color={theme.textSecondary} />
        </button>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${rc.c}35, ${rc.c}10)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 800, color: rc.c,
        }}>{m.initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: theme.text, fontFamily: "'Outfit', sans-serif" }}>{m.name}</div>
          <div style={{ fontSize: 12, color: theme.textSecondary }}>{m.email} · {m.plan} (${m.price}/mo)</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          <RiskPill level={m.level} theme={theme} />
          <span style={{ fontSize: 28, fontWeight: 900, color: rc.c, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.04em" }}>{m.risk}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        {/* Subscription */}
        <Card theme={theme} style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Ico d={ICO.user} size={13} color={theme.accent} /> Subscription
          </div>
          {[
            ["Plan", m.plan + ` ($${m.price}/mo)`],
            ["Since", `${m.since} (${m.tenure})`],
            ["Renewal", `${m.renewal}${m.cancelScheduled ? "  ⚠️ CANCEL SCHEDULED" : ""}`],
            ["LTV", `$${m.ltv.toLocaleString()}`],
            ["Failures", m.failures > 0 ? `${m.failures} recent` : "None"],
          ].map(([l, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 4 ? `1px solid ${theme.border}` : "none" }}>
              <span style={{ fontSize: 12, color: theme.textMuted }}>{l}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: (l === "Renewal" && m.cancelScheduled) || (l === "Failures" && m.failures > 0) ? theme.critical : theme.text }}>{v}</span>
            </div>
          ))}
        </Card>

        {/* Risk Factors */}
        <Card theme={theme} style={{ padding: "18px 20px", borderColor: m.level === "critical" ? theme.criticalBorder : theme.border }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Ico d={ICO.alert} size={13} color={theme.critical} /> Risk Factors
          </div>
          {m.factors.length > 0 ? m.factors.map((f, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", fontSize: 12, color: theme.textSecondary, lineHeight: 1.5 }}>
              <Dot color={i < 2 ? theme.critical : theme.high} size={6} style={{ marginTop: 5, flexShrink: 0 }} />
              <span>{f}</span>
            </div>
          )) : (
            <div style={{ fontSize: 12, color: theme.success, display: "flex", alignItems: "center", gap: 6 }}>
              <Ico d={ICO.check} size={14} color={theme.success} /> No risk factors — healthy member
            </div>
          )}
        </Card>

        {/* Engagement */}
        <Card theme={theme} style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Ico d={ICO.bar} size={13} color={theme.accent} /> Engagement (8 weeks)
          </div>
          <EngChart data={chartData} theme={theme} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: theme.textMuted }}>
            <span>Messages / week</span>
            <span>Last seen: {m.lastSeen}</span>
          </div>
        </Card>

        {/* Playbook + History */}
        <Card theme={theme} style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Ico d={ICO.zap} size={13} color={theme.accent} /> Playbook & History
          </div>
          {m.playbook && (
            <div style={{ background: theme.bgAccentSubtle, border: `1px solid ${theme.borderAccent}`, borderRadius: 8, padding: "10px 12px", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 650, color: theme.accentText }}>{m.playbook}</div>
            </div>
          )}
          <div style={{ fontSize: 12, color: theme.textSecondary, lineHeight: 1.8 }}>
            <div>· Feb 22 — Email "Value Reminder" — Opened ✓</div>
            <div>· Feb 20 — Payment failure detected</div>
            <div>· Jan 15 — Email "Monthly Highlights" — Clicked ✓</div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        <Btn variant="primary" size="md" theme={theme}><Ico d={ICO.send} size={13} color="#fff" /> Send Email</Btn>
        <Btn variant="default" size="md" theme={theme}>💬 Whop Chat</Btn>
        <Btn variant="default" size="md" theme={theme}>📝 Add Note</Btn>
        {(m.level === "critical" || m.level === "high") && !m.playbook && (
          <Btn variant="accent" size="md" theme={theme}><Ico d={ICO.zap} size={13} color={theme.accentText} /> Start Playbook</Btn>
        )}
      </div>
    </div>
  );
};

// PLAYBOOKS
const PlaybooksScreen = ({ theme, onPlaybook, isMobile }) => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
      <StatBlock label="In Sequences" value="43" sub="3 playbooks active" accent={theme.accent} theme={theme} />
      <StatBlock label="Revenue Saved" value="$18,450" sub="This month (est.)" accent={theme.success} theme={theme} />
      <StatBlock label="Manual Work" value="0h" sub="Fully automated" accent={theme.accentText} theme={theme} />
      <StatBlock label="ROI" value="124x" sub="$149 plan → $18.4K impact" accent={theme.success} theme={theme} />
    </div>

    {PLAYBOOKS.map((pb, idx) => (
      <Card key={pb.id} theme={theme} onClick={() => onPlaybook(pb)} style={{ padding: "18px 20px", marginBottom: 10, cursor: "pointer", animation: `fadeSlideIn 0.3s ease ${idx * 0.05}s both` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>{pb.emoji}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{pb.name}</div>
              <div style={{ fontSize: 11, color: theme.textMuted }}>{pb.desc}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <Pill c={theme.success} bg={theme.successBg}>Active</Pill>
            <span style={{ fontSize: 12, color: theme.textSecondary }}>{pb.enrolled} enrolled</span>
          </div>
        </div>

        {/* Funnel bars */}
        <div style={{ display: "flex", gap: 3, marginBottom: 12 }}>
          {pb.steps.map((s, i) => {
            const pct = s.sent / pb.enrolled;
            return (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ height: 5, background: theme.bgInput, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct * 100}%`, height: "100%", background: theme.accent, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: 9, color: theme.textMuted, marginTop: 3, textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.n}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: theme.success }}>✓ {pb.recentWin}</span>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: theme.accent, fontFamily: "'Outfit', sans-serif" }}>{pb.rate}%</span>
            <span style={{ fontSize: 11, color: theme.textMuted, marginLeft: 4 }}>success</span>
          </div>
        </div>
      </Card>
    ))}

    {/* Pro upsell */}
    <div style={{
      border: `1px dashed ${theme.borderHover}`, borderRadius: 12, padding: "20px 18px", marginTop: 8,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      color: theme.textMuted, fontSize: 12, fontWeight: 500, opacity: 0.7,
    }}>
      <Ico d={ICO.sparkle} size={16} color={theme.textMuted} />
      Custom playbook builder + 3 more playbooks — Upgrade to Pro
    </div>
  </div>
);

// PLAYBOOK DETAIL
const PlaybookDetail = ({ playbook: pb, theme, onBack, isMobile }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
      <button onClick={onBack} style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 8, padding: 6, cursor: "pointer", display: "flex" }}>
        <Ico d={ICO.back} size={16} color={theme.textSecondary} />
      </button>
      <span style={{ fontSize: 22 }}>{pb.emoji}</span>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: theme.text, fontFamily: "'Outfit', sans-serif" }}>{pb.name}</div>
        <div style={{ fontSize: 12, color: theme.textSecondary }}>{pb.enrolled} enrolled · {pb.desc}</div>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        <Pill c={theme.success} bg={theme.successBg}>Active</Pill>
        <Btn variant="default" size="xs" theme={theme}>⏸ Pause</Btn>
        <Btn variant="default" size="xs" theme={theme}>⚙ Config</Btn>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
      <StatBlock label="Enrolled" value={pb.enrolled} theme={theme} accent={theme.accent} />
      <StatBlock label="Success Rate" value={`${pb.rate}%`} theme={theme} accent={theme.success} />
      <StatBlock label="Avg Re-engage" value="3.2d" theme={theme} accent={theme.accentText} />
      <StatBlock label="Revenue Saved" value={pb.saved} theme={theme} accent={theme.success} />
    </div>

    {/* Funnel */}
    <Card theme={theme} style={{ padding: "20px 22px", marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 18 }}>Step Funnel</div>
      {pb.steps.map((s, i) => {
        const val = Object.values(s).find(v => typeof v === "number" && v !== s.sent) || s.sent;
        const pct = Math.round((s.sent / pb.enrolled) * 100);
        return (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: theme.bgAccentSubtle, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, color: theme.accentText, fontFamily: "'Outfit', sans-serif",
              }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: theme.text, marginBottom: 5 }}>{s.n}</div>
                <ProgressBar value={pct} color={theme.accent} theme={theme} h={6} />
              </div>
              <div style={{ textAlign: "right", minWidth: 50 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: theme.text, fontFamily: "'Outfit', sans-serif" }}>{s.sent}</div>
                <div style={{ fontSize: 10, color: theme.textMuted }}>sent</div>
              </div>
            </div>
            {i < pb.steps.length - 1 && <div style={{ marginLeft: 14, width: 1, height: 8, background: theme.border }} />}
          </div>
        );
      })}
    </Card>

    {/* Activity */}
    <Card theme={theme} style={{ padding: "18px 20px" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 14 }}>Recent Activity</div>
      {[
        { t: "2h ago", e: "Jake1987 opened value reminder email", i: "✉️" },
        { t: "5h ago", e: "Mike_Crypto re-engaged after community invite", i: "✅" },
        { t: "1d ago", e: "Sarah_T enrolled in playbook", i: "▶️" },
        { t: "2d ago", e: "TradingPro opened check-in, no response yet", i: "👁" },
      ].map((a, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < 3 ? `1px solid ${theme.border}` : "none" }}>
          <span style={{ fontSize: 14 }}>{a.i}</span>
          <span style={{ flex: 1, fontSize: 12, color: theme.textSecondary }}>{a.e}</span>
          <span style={{ fontSize: 10, color: theme.textMuted, whiteSpace: "nowrap" }}>{a.t}</span>
        </div>
      ))}
    </Card>
  </div>
);

// ANALYTICS
const AnalyticsScreen = ({ theme, isMobile }) => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 22 }}>
      <StatBlock label="Total Members" value="847" sub="+23 this month" theme={theme} />
      <StatBlock label="Churn Rate (30d)" value="4.2%" sub="↓ from 6.8% last month" accent={theme.success} theme={theme} />
      <StatBlock label="Saved This Month" value="18" sub="Via playbooks" accent={theme.success} theme={theme} />
      <StatBlock label="Revenue Protected" value="$24.6K" sub="Cumulative" accent={theme.success} theme={theme} />
    </div>

    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
      <Card theme={theme} style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Risk Distribution</div>
        {[
          { l: "Critical", n: 23, p: 2.7, c: theme.critical },
          { l: "High", n: 67, p: 7.9, c: theme.high },
          { l: "Medium", n: 112, p: 13.2, c: theme.medium },
          { l: "Low", n: 645, p: 76.2, c: theme.low },
        ].map((r, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: theme.text, fontWeight: 500 }}>{r.l}</span>
              <span style={{ fontSize: 12, color: theme.textMuted }}>{r.n} ({r.p}%)</span>
            </div>
            <ProgressBar value={r.p} color={r.c} theme={theme} h={5} />
          </div>
        ))}
      </Card>

      <Card theme={theme} style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Churn Reasons (90d)</div>
        {[
          { r: "Not enough value", p: 34 },
          { r: "Too expensive", p: 22 },
          { r: "Don't have time", p: 19 },
          { r: "Found alternative", p: 15 },
          { r: "Other / unknown", p: 10 },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: theme.text }}>{item.r}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: theme.accentText }}>{item.p}%</span>
            </div>
            <ProgressBar value={item.p} color={theme.accent} theme={theme} h={5} />
          </div>
        ))}
      </Card>

      <Card theme={theme} style={{ padding: "18px 20px", gridColumn: isMobile ? undefined : "1 / -1" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Monthly Impact</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16 }}>
          {[
            { l: "Churn Prevented", v: "$18,450" },
            { l: "Win-Backs", v: "$5,640" },
            { l: "Upsells", v: "$2,150" },
            { l: "Total Impact", v: "$26,240", accent: true },
          ].map((item, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: item.accent ? theme.success : theme.text, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" }}>{item.v}</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 4 }}>{item.l}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

// SETTINGS
const SettingsScreen = ({ theme, darkMode, setDarkMode, isMobile }) => (
  <div>
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
      {/* Integrations */}
      <Card theme={theme} style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <Ico d={ICO.link} size={14} color={theme.accent} /> Integrations
        </div>
        {[
          { n: "Whop API", on: true, s: "Syncing every 4h" },
          { n: "Discord Bot", on: true, s: "847 members tracked" },
          { n: "Telegram Bot", on: false, s: "Not connected" },
          { n: "Resend (Email)", on: true, s: "287 emails this month" },
        ].map((int, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 3 ? `1px solid ${theme.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{int.n}</div>
              <div style={{ fontSize: 10, color: theme.textMuted }}>{int.s}</div>
            </div>
            {int.on
              ? <Pill c={theme.success} bg={theme.successBg}>Connected</Pill>
              : <Btn variant="accent" size="xs" theme={theme}>Connect</Btn>
            }
          </div>
        ))}
      </Card>

      {/* Outreach */}
      <Card theme={theme} style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
          <Ico d={ICO.mail} size={14} color={theme.accent} /> Outreach Preferences
        </div>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 10 }}>Channel priority:</div>
        {["Email (always available)", "Whop Chat", "Discord DM", "Telegram"].map((ch, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: theme.bgInput, borderRadius: 7, marginBottom: 4, fontSize: 12, color: theme.text }}>
            <span style={{ color: theme.textMuted, fontWeight: 700, fontSize: 11, width: 16 }}>{i + 1}</span>
            <span style={{ flex: 1 }}>{ch}</span>
            <span style={{ color: theme.textMuted, cursor: "grab", fontSize: 10 }}>⋮⋮</span>
          </div>
        ))}
        <div style={{ marginTop: 16 }}>
          {[
            { l: "Auto-enroll playbooks", s: "Start when triggers are met", on: true },
            { l: "Daily digest email", s: "Morning summary of at-risk members", on: true },
          ].map((opt, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <div>
                <div style={{ fontSize: 12, color: theme.text, fontWeight: 500 }}>{opt.l}</div>
                <div style={{ fontSize: 10, color: theme.textMuted }}>{opt.s}</div>
              </div>
              <Toggle on={opt.on} onToggle={() => {}} theme={theme} />
            </div>
          ))}
        </div>
      </Card>

      {/* Appearance */}
      <Card theme={theme} style={{ padding: "18px 20px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text, marginBottom: 16 }}>Appearance</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Ico d={darkMode ? ICO.moon : ICO.sun} size={16} color={theme.textSecondary} />
            <span style={{ fontSize: 12, color: theme.text }}>{darkMode ? "Dark Mode" : "Light Mode"}</span>
          </div>
          <Toggle on={darkMode} onToggle={() => setDarkMode(!darkMode)} theme={theme} />
        </div>
      </Card>

      {/* Plan */}
      <Card theme={theme} style={{ padding: "18px 20px", background: `linear-gradient(135deg, ${theme.bgAccentSubtle}, ${theme.bgCard})`, borderColor: theme.borderAccent }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Current Plan</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: theme.text, fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.02em" }}>
          Growth <span style={{ fontSize: 13, fontWeight: 500, color: theme.textSecondary }}>$149/month</span>
        </div>
        <div style={{ fontSize: 12, color: theme.textSecondary, marginTop: 4, marginBottom: 14, lineHeight: 1.5 }}>
          Up to 2,000 members · 3 automated playbooks · AI personalization · A/B testing
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="primary" size="sm" theme={theme}>Upgrade to Pro ($299)</Btn>
          <Btn variant="ghost" size="sm" theme={theme}>Manage Billing</Btn>
        </div>
      </Card>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════
// MAIN APP SHELL
// ═══════════════════════════════════════════════════════
export default function GripApp() {
  const [darkMode, setDarkMode] = useState(true);
  const [screen, setScreen] = useState("dashboard");
  const [member, setMember] = useState(null);
  const [playbook, setPlaybook] = useState(null);
  const [width, setWidth] = useState(900);
  const containerRef = useRef(null);

  const theme = darkMode ? THEMES.dark : THEMES.light;
  const isMobile = width < 640;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nav = (s) => { setScreen(s); setMember(null); setPlaybook(null); };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: ICO.home, badge: 23 },
    { id: "playbooks", label: "Playbooks", icon: ICO.zap },
    { id: "analytics", label: "Analytics", icon: ICO.bar },
    { id: "settings", label: "Settings", icon: ICO.gear },
  ];

  const currentTitle = member ? member.name : playbook ? playbook.name
    : screen === "playbooks" ? "Playbooks" : screen === "analytics" ? "Analytics"
    : screen === "settings" ? "Settings" : "Dashboard";

  const renderContent = () => {
    if (member) return <MemberDetail member={member} theme={theme} onBack={() => setMember(null)} isMobile={isMobile} />;
    if (playbook) return <PlaybookDetail playbook={playbook} theme={theme} onBack={() => setPlaybook(null)} isMobile={isMobile} />;
    switch (screen) {
      case "playbooks": return <PlaybooksScreen theme={theme} onPlaybook={setPlaybook} isMobile={isMobile} />;
      case "analytics": return <AnalyticsScreen theme={theme} isMobile={isMobile} />;
      case "settings": return <SettingsScreen theme={theme} darkMode={darkMode} setDarkMode={setDarkMode} isMobile={isMobile} />;
      default: return <Dashboard theme={theme} onMember={setMember} isMobile={isMobile} />;
    }
  };

  return (
    <div ref={containerRef} style={{
      fontFamily: "'Plus Jakarta Sans', 'Outfit', -apple-system, sans-serif",
      background: theme.bg, color: theme.text, minHeight: "100vh",
      transition: "background 0.35s, color 0.35s",
      maxWidth: "100%", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 3px; }
        button { transition: all 0.12s ease; }
        button:hover { filter: brightness(1.08); }
        button:active { transform: scale(0.97); }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* ─── TOP NAV BAR (replaces sidebar — Whop already has sidebar) ─── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: theme.bgRaised, borderBottom: `1px solid ${theme.border}`,
        transition: "background 0.35s, border-color 0.35s",
      }}>
        {/* Primary bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: isMobile ? "10px 14px" : "10px 20px",
          maxWidth: 1200, margin: "0 auto",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
            <GripLogo size={26} theme={theme} />
            {!isMobile && <GripWordmark theme={theme} />}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: theme.border, flexShrink: 0 }} />

          {/* Community name */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 7, background: theme.bgAccentSubtle, cursor: "pointer" }}>
            <span style={{ fontSize: 12, fontWeight: 650, color: theme.text }}>{isMobile ? "CA" : "Crypto Alpha"}</span>
            <span style={{ fontSize: 10, color: theme.textMuted }}>847</span>
            <Ico d={ICO.chevDown} size={12} color={theme.textMuted} />
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, color: theme.textMuted }}>Synced 2m ago</span>
            <button onClick={() => setDarkMode(!darkMode)} style={{
              background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: 7,
              padding: 5, cursor: "pointer", display: "flex",
            }}>
              <Ico d={darkMode ? ICO.sun : ICO.moon} size={14} color={theme.textSecondary} />
            </button>
            <button style={{
              background: theme.bgInput, border: `1px solid ${theme.border}`, borderRadius: 7,
              padding: 5, cursor: "pointer", display: "flex", position: "relative",
            }}>
              <Ico d={ICO.bell} size={14} color={theme.textSecondary} />
              <span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, background: theme.critical, border: `2px solid ${theme.bgRaised}` }} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 0, padding: isMobile ? "0 8px" : "0 20px",
          maxWidth: 1200, margin: "0 auto",
          overflowX: "auto",
        }}>
          {tabs.map(tab => {
            const active = screen === tab.id && !member && !playbook;
            return (
              <button key={tab.id} onClick={() => nav(tab.id)} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: isMobile ? "8px 12px" : "8px 16px",
                borderRadius: 0, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: active ? 650 : 500, fontFamily: "inherit",
                color: active ? theme.accentText : theme.textMuted,
                background: "transparent",
                borderBottom: `2px solid ${active ? theme.accent : "transparent"}`,
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}>
                <Ico d={tab.icon} size={14} color={active ? theme.accentText : theme.textMuted} />
                {tab.label}
                {tab.badge && (
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    padding: "1px 6px", borderRadius: 5,
                    background: theme.criticalBg, color: theme.critical,
                  }}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div style={{
        padding: isMobile ? "16px 12px" : "20px 20px",
        maxWidth: 1200, margin: "0 auto",
        animation: "fadeIn 0.25s ease",
      }}>
        {renderContent()}
      </div>

      {/* ─── FOOTER ─── */}
      <div style={{
        padding: "12px 20px", borderTop: `1px solid ${theme.border}`,
        display: "flex", justifyContent: "center", alignItems: "center", gap: 8,
        maxWidth: 1200, margin: "0 auto",
      }}>
        <GripLogo size={16} theme={theme} />
        <span style={{ fontSize: 10, color: theme.textMuted }}>Grip Retention Engine · Growth Plan · Powered by AI</span>
      </div>
    </div>
  );
}

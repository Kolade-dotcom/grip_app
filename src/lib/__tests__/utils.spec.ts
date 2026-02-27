import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyShort,
  timeAgo,
  formatDate,
  riskColor,
  riskBgColor,
  truncate,
  initials,
  cn,
} from "../utils";

describe("formatCurrency", () => {
  it("formats cents as dollars", () => {
    expect(formatCurrency(4999)).toBe("$49.99");
    expect(formatCurrency(100)).toBe("$1.00");
    expect(formatCurrency(0)).toBe("$0.00");
    expect(formatCurrency(10050)).toBe("$100.50");
  });
});

describe("formatCurrencyShort", () => {
  it("formats small amounts without decimals", () => {
    expect(formatCurrencyShort(4999)).toBe("$50");
    expect(formatCurrencyShort(9900)).toBe("$99");
  });

  it("formats thousands with k suffix", () => {
    expect(formatCurrencyShort(150000)).toBe("$1.5k");
    expect(formatCurrencyShort(1000000)).toBe("$10.0k");
  });
});

describe("timeAgo", () => {
  it("returns 'just now' for recent timestamps", () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });

  it("returns months ago", () => {
    const twoMonthsAgo = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoMonthsAgo)).toBe("2mo ago");
  });
});

describe("formatDate", () => {
  it("formats as short month + day", () => {
    const result = formatDate("2026-01-15T00:00:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
  });
});

describe("riskColor", () => {
  it("returns correct text class per level", () => {
    expect(riskColor("critical")).toBe("text-risk-critical");
    expect(riskColor("high")).toBe("text-risk-high");
    expect(riskColor("medium")).toBe("text-risk-medium");
    expect(riskColor("low")).toBe("text-risk-low");
  });
});

describe("riskBgColor", () => {
  it("returns combined bg + text class per level", () => {
    expect(riskBgColor("critical")).toContain("bg-risk-critical-bg");
    expect(riskBgColor("critical")).toContain("text-risk-critical");
    expect(riskBgColor("low")).toContain("bg-risk-low-bg");
    expect(riskBgColor("low")).toContain("text-risk-low");
  });
});

describe("truncate", () => {
  it("returns original string if within limit", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates with ellipsis", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
  });

  it("handles exact length", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });
});

describe("initials", () => {
  it("returns initials from full name", () => {
    expect(initials("John Doe")).toBe("JD");
  });

  it("returns single initial for single name", () => {
    expect(initials("Alice")).toBe("A");
  });

  it("limits to 2 initials", () => {
    expect(initials("John Michael Doe")).toBe("JM");
  });

  it("returns ? for null", () => {
    expect(initials(null)).toBe("?");
  });

  it("returns ? for empty string", () => {
    expect(initials("")).toBe("?");
  });
});

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("filters out falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("returns empty string for all falsy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

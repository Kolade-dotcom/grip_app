import { describe, it, expect } from "vitest";
import { canAccess, getUpgradeTier, getPlanLabel, getPlanPrice, PLAN_LIMITS } from "../plan-limits";
import type { PlanTier } from "../plan-limits";

describe("PLAN_LIMITS", () => {
  it("defines all 5 tiers", () => {
    const tiers: PlanTier[] = ["free", "starter", "growth", "pro", "enterprise"];
    tiers.forEach((tier) => {
      expect(PLAN_LIMITS[tier]).toBeDefined();
    });
  });

  it("free tier has 0 playbooks and 0 manual emails", () => {
    expect(PLAN_LIMITS.free.playbooks).toBe(0);
    expect(PLAN_LIMITS.free.manualEmails).toBe(0);
  });

  it("free tier disables all integrations", () => {
    expect(PLAN_LIMITS.free.discordIntegration).toBe(false);
    expect(PLAN_LIMITS.free.telegramIntegration).toBe(false);
    expect(PLAN_LIMITS.free.aiPersonalization).toBe(false);
  });

  it("starter tier allows 1 playbook and Discord", () => {
    expect(PLAN_LIMITS.starter.playbooks).toBe(1);
    expect(PLAN_LIMITS.starter.discordIntegration).toBe(true);
    expect(PLAN_LIMITS.starter.automatedOutreach).toBe(false);
  });

  it("growth tier enables automation and AI", () => {
    expect(PLAN_LIMITS.growth.automatedOutreach).toBe(true);
    expect(PLAN_LIMITS.growth.aiPersonalization).toBe(true);
    expect(PLAN_LIMITS.growth.abTesting).toBe(true);
    expect(PLAN_LIMITS.growth.playbooks).toBe(3);
  });

  it("pro tier has unlimited playbooks and members", () => {
    expect(PLAN_LIMITS.pro.playbooks).toBe(Infinity);
    expect(PLAN_LIMITS.pro.maxMembers).toBe(Infinity);
  });

  it("prices increase across tiers", () => {
    expect(PLAN_LIMITS.free.price).toBe(0);
    expect(PLAN_LIMITS.starter.price).toBeLessThan(PLAN_LIMITS.growth.price);
    expect(PLAN_LIMITS.growth.price).toBeLessThan(PLAN_LIMITS.pro.price);
    expect(PLAN_LIMITS.pro.price).toBeLessThan(PLAN_LIMITS.enterprise.price);
  });
});

describe("canAccess", () => {
  it("returns false for free tier on playbooks", () => {
    expect(canAccess("free", "playbooks")).toBe(false);
  });

  it("returns false for free tier on discordIntegration", () => {
    expect(canAccess("free", "discordIntegration")).toBe(false);
  });

  it("returns true for starter on discordIntegration", () => {
    expect(canAccess("starter", "discordIntegration")).toBe(true);
  });

  it("returns false for starter on automatedOutreach", () => {
    expect(canAccess("starter", "automatedOutreach")).toBe(false);
  });

  it("returns true for growth on aiPersonalization", () => {
    expect(canAccess("growth", "aiPersonalization")).toBe(true);
  });

  it("returns true for any paid tier on manualEmails", () => {
    expect(canAccess("starter", "manualEmails")).toBe(true);
    expect(canAccess("growth", "manualEmails")).toBe(true);
    expect(canAccess("pro", "manualEmails")).toBe(true);
  });
});

describe("getUpgradeTier", () => {
  it("returns starter for free", () => {
    expect(getUpgradeTier("free")).toBe("starter");
  });

  it("returns growth for starter", () => {
    expect(getUpgradeTier("starter")).toBe("growth");
  });

  it("returns pro for growth", () => {
    expect(getUpgradeTier("growth")).toBe("pro");
  });

  it("returns enterprise for pro", () => {
    expect(getUpgradeTier("pro")).toBe("enterprise");
  });

  it("returns null for enterprise (no upgrade available)", () => {
    expect(getUpgradeTier("enterprise")).toBeNull();
  });
});

describe("getPlanLabel", () => {
  it("returns human-readable labels", () => {
    expect(getPlanLabel("free")).toBe("Free");
    expect(getPlanLabel("starter")).toBe("Starter");
    expect(getPlanLabel("growth")).toBe("Growth");
    expect(getPlanLabel("pro")).toBe("Pro");
    expect(getPlanLabel("enterprise")).toBe("Enterprise");
  });
});

describe("getPlanPrice", () => {
  it("returns correct prices", () => {
    expect(getPlanPrice("free")).toBe(0);
    expect(getPlanPrice("starter")).toBe(49);
    expect(getPlanPrice("growth")).toBe(149);
    expect(getPlanPrice("pro")).toBe(299);
    expect(getPlanPrice("enterprise")).toBe(999);
  });
});

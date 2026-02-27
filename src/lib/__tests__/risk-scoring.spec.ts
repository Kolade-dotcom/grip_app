import { describe, it, expect } from "vitest";
import { calculateChurnRisk, daysUntilRenewal } from "../risk-scoring";
import type { Member } from "@/types/member";

function makeMember(overrides: Partial<Member & { days_until_renewal?: number | null; engagement_score?: number }> = {}) {
  return {
    id: "m-1",
    community_id: "c-1",
    whop_membership_id: "wm-1",
    whop_user_id: "wu-1",
    email: "test@example.com",
    username: "testuser",
    first_name: "Test",
    subscription_status: "active" as const,
    plan_id: "p-1",
    plan_name: "Basic",
    plan_price_cents: 9900,
    current_period_start: "2026-01-01T00:00:00Z",
    current_period_end: "2026-03-01T00:00:00Z",
    cancel_at_period_end: false,
    ltv_cents: 29700,
    tenure_days: 90,
    previous_cancellations: 0,
    recent_payment_failures: 0,
    discord_user_id: null,
    telegram_user_id: null,
    has_engagement_data: false,
    created_at: "2025-12-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    days_until_renewal: 30,
    ...overrides,
  };
}

describe("calculateChurnRisk", () => {
  it("returns low risk for healthy long-tenured member", () => {
    const result = calculateChurnRisk(makeMember({ tenure_days: 180, days_until_renewal: 25 }));
    expect(result.level).toBe("low");
    expect(result.score).toBeLessThan(20);
    expect(result.factors).toHaveLength(0);
  });

  it("scores cancellation scheduled as critical factor", () => {
    const result = calculateChurnRisk(makeMember({ cancel_at_period_end: true }));
    expect(result.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ factor: "cancellation_scheduled", severity: "critical" }),
      ])
    );
    expect(result.score).toBeGreaterThanOrEqual(10);
  });

  it("scores imminent renewal (<=7 days) as high", () => {
    const result = calculateChurnRisk(makeMember({ days_until_renewal: 5 }));
    expect(result.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ factor: "renewal_imminent", points: 15 }),
      ])
    );
  });

  it("does not flag renewal when more than 7 days away", () => {
    const result = calculateChurnRisk(makeMember({ days_until_renewal: 15 }));
    const renewalFactor = result.factors.find((f) => f.factor === "renewal_imminent");
    expect(renewalFactor).toBeUndefined();
  });

  it("scores single payment failure at 20 points", () => {
    const result = calculateChurnRisk(makeMember({ recent_payment_failures: 1 }));
    const factor = result.factors.find((f) => f.factor === "payment_failure");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(20);
    expect(factor!.severity).toBe("critical");
  });

  it("scores multiple payment failures at 25 points", () => {
    const result = calculateChurnRisk(makeMember({ recent_payment_failures: 3 }));
    const factor = result.factors.find((f) => f.factor === "payment_failure");
    expect(factor!.points).toBe(25);
  });

  it("scores new member (<14 days) as medium risk", () => {
    const result = calculateChurnRisk(makeMember({ tenure_days: 7 }));
    expect(result.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ factor: "new_member", severity: "medium" }),
      ])
    );
  });

  it("adds no_engagement_visibility for new members without engagement data", () => {
    const result = calculateChurnRisk(
      makeMember({ tenure_days: 5, has_engagement_data: false })
    );
    expect(result.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ factor: "no_engagement_visibility" }),
      ])
    );
  });

  it("does not add no_engagement_visibility when engagement data exists", () => {
    const result = calculateChurnRisk(
      makeMember({ tenure_days: 5, has_engagement_data: true, engagement_score: 50 })
    );
    const factor = result.factors.find((f) => f.factor === "no_engagement_visibility");
    expect(factor).toBeUndefined();
  });

  it("scores first renewal approaching for new members", () => {
    const result = calculateChurnRisk(
      makeMember({ tenure_days: 25, days_until_renewal: 5 })
    );
    expect(result.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ factor: "first_renewal", severity: "high", points: 15 }),
      ])
    );
  });

  it("scores previous cancellations", () => {
    const result = calculateChurnRisk(makeMember({ previous_cancellations: 2 }));
    expect(result.factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ factor: "previous_cancellation", points: 10 }),
      ])
    );
  });

  it("scores very low engagement (<15) at 20 points", () => {
    const result = calculateChurnRisk(
      makeMember({ has_engagement_data: true, engagement_score: 10 })
    );
    const factor = result.factors.find((f) => f.factor === "very_low_engagement");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(20);
  });

  it("scores declining engagement (15-29) at 10 points", () => {
    const result = calculateChurnRisk(
      makeMember({ has_engagement_data: true, engagement_score: 25 })
    );
    const factor = result.factors.find((f) => f.factor === "declining_engagement");
    expect(factor).toBeDefined();
    expect(factor!.points).toBe(10);
  });

  it("caps score at 100", () => {
    const result = calculateChurnRisk(
      makeMember({
        cancel_at_period_end: true,
        recent_payment_failures: 3,
        tenure_days: 7,
        days_until_renewal: 3,
        previous_cancellations: 2,
        has_engagement_data: true,
        engagement_score: 5,
      })
    );
    expect(result.score).toBe(100);
  });

  it("classifies critical at score >= 70", () => {
    const result = calculateChurnRisk(
      makeMember({
        cancel_at_period_end: true,
        recent_payment_failures: 2,
        tenure_days: 10,
        days_until_renewal: 5,
      })
    );
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.level).toBe("critical");
  });

  it("classifies high at score 40-69", () => {
    const result = calculateChurnRisk(
      makeMember({ previous_cancellations: 1, days_until_renewal: 5, tenure_days: 25 })
    );
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(70);
    expect(result.level).toBe("high");
  });

  it("classifies medium at score 20-39", () => {
    const result = calculateChurnRisk(
      makeMember({ tenure_days: 10, days_until_renewal: 20 })
    );
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.score).toBeLessThan(40);
    expect(result.level).toBe("medium");
  });

  it("returns high confidence when engagement data is present", () => {
    const result = calculateChurnRisk(
      makeMember({ has_engagement_data: true, engagement_score: 60 })
    );
    expect(result.confidence).toBe("high");
  });

  it("returns medium confidence for long-tenured members without engagement", () => {
    const result = calculateChurnRisk(
      makeMember({ tenure_days: 60, has_engagement_data: false })
    );
    expect(result.confidence).toBe("medium");
  });

  it("returns low confidence for new members without engagement", () => {
    const result = calculateChurnRisk(
      makeMember({ tenure_days: 10, has_engagement_data: false })
    );
    expect(result.confidence).toBe("low");
  });
});

describe("daysUntilRenewal", () => {
  it("returns null for null input", () => {
    expect(daysUntilRenewal(null)).toBeNull();
  });

  it("returns positive days for future dates", () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const result = daysUntilRenewal(future.toISOString());
    expect(result).toBeGreaterThanOrEqual(9);
    expect(result).toBeLessThanOrEqual(11);
  });

  it("returns negative days for past dates", () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const result = daysUntilRenewal(past.toISOString());
    expect(result).toBeLessThanOrEqual(-4);
  });
});

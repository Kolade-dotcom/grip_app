import { describe, it, expect } from "vitest";
import { checkTriggerConditions, SYSTEM_PLAYBOOKS } from "../playbook-engine";

describe("checkTriggerConditions", () => {
  it("returns true when all conditions are met", () => {
    const member = { tenure_days: 3, subscription_status: "active" };
    const conditions = [
      { field: "tenure_days", operator: "lt" as const, value: 7 },
      { field: "subscription_status", operator: "eq" as const, value: "active" },
    ];
    expect(checkTriggerConditions(member, conditions)).toBe(true);
  });

  it("returns false when eq condition is not met", () => {
    const member = { subscription_status: "cancelled" };
    const conditions = [
      { field: "subscription_status", operator: "eq" as const, value: "active" },
    ];
    expect(checkTriggerConditions(member, conditions)).toBe(false);
  });

  it("returns false when gt condition is not met", () => {
    const member = { recent_payment_failures: 0 };
    const conditions = [
      { field: "recent_payment_failures", operator: "gt" as const, value: 0 },
    ];
    expect(checkTriggerConditions(member, conditions)).toBe(false);
  });

  it("handles gte operator correctly", () => {
    expect(
      checkTriggerConditions(
        { score: 70 },
        [{ field: "score", operator: "gte" as const, value: 70 }]
      )
    ).toBe(true);

    expect(
      checkTriggerConditions(
        { score: 69 },
        [{ field: "score", operator: "gte" as const, value: 70 }]
      )
    ).toBe(false);
  });

  it("handles lte operator correctly", () => {
    expect(
      checkTriggerConditions(
        { days_until_renewal: 7 },
        [{ field: "days_until_renewal", operator: "lte" as const, value: 7 }]
      )
    ).toBe(true);
  });

  it("handles in operator correctly", () => {
    const member = { risk_level: "high" };
    const conditions = [
      { field: "risk_level", operator: "in" as const, value: ["high", "critical"] },
    ];
    expect(checkTriggerConditions(member, conditions)).toBe(true);

    const memberLow = { risk_level: "low" };
    expect(checkTriggerConditions(memberLow, conditions)).toBe(false);
  });

  it("returns true for empty conditions", () => {
    expect(checkTriggerConditions({}, [])).toBe(true);
  });
});

describe("SYSTEM_PLAYBOOKS", () => {
  it("contains 4 system playbooks", () => {
    expect(SYSTEM_PLAYBOOKS).toHaveLength(4);
  });

  it("each playbook has required structure", () => {
    for (const pb of SYSTEM_PLAYBOOKS) {
      expect(pb).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          emoji: expect.any(String),
          description: expect.any(String),
          playbook_type: "system",
          min_tier: expect.any(String),
          trigger_conditions: expect.any(Array),
          steps: expect.any(Array),
        })
      );
      expect(pb.steps.length).toBeGreaterThan(0);
    }
  });
});

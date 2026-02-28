import { describe, it, expect } from "vitest";
import { canReach, renderTemplate, EMAIL_TEMPLATES } from "../outreach";

describe("canReach", () => {
  const baseMember = { email: "test@example.com", discord_user_id: null, telegram_user_id: null };
  const baseCommunity = { discord_bot_installed: false, telegram_bot_installed: false, whop_chat_enabled: false };

  it("returns true for email when member has email", () => {
    expect(canReach(baseMember, "email", baseCommunity)).toBe(true);
  });

  it("returns false for email when member has no email", () => {
    expect(canReach({ ...baseMember, email: null }, "email", baseCommunity)).toBe(false);
  });

  it("returns true for discord_dm when member has discord_user_id and bot is installed", () => {
    expect(
      canReach(
        { ...baseMember, discord_user_id: "123" },
        "discord_dm",
        { ...baseCommunity, discord_bot_installed: true }
      )
    ).toBe(true);
  });

  it("returns false for discord_dm when bot is not installed", () => {
    expect(
      canReach({ ...baseMember, discord_user_id: "123" }, "discord_dm", baseCommunity)
    ).toBe(false);
  });

  it("returns true for telegram when member has telegram_user_id and bot is installed", () => {
    expect(
      canReach(
        { ...baseMember, telegram_user_id: "456" },
        "telegram",
        { ...baseCommunity, telegram_bot_installed: true }
      )
    ).toBe(true);
  });

  it("returns true for whop_chat when community has it enabled", () => {
    expect(
      canReach(baseMember, "whop_chat", { ...baseCommunity, whop_chat_enabled: true })
    ).toBe(true);
  });
});

describe("renderTemplate", () => {
  const checkInTemplate = EMAIL_TEMPLATES.find((t) => t.id === "check_in")!;

  it("replaces all variable placeholders in subject and body", () => {
    const variables = {
      firstName: "Alice",
      communityName: "Alpha Traders",
      creatorName: "Bob",
    };
    const result = renderTemplate(checkInTemplate, variables);

    expect(result.subject).toBe("Hey Alice, we miss you in Alpha Traders!");
    expect(result.body).toContain("Hey Alice,");
    expect(result.body).toContain("<strong>Alpha Traders</strong>");
    expect(result.body).toContain("— Bob");
  });

  it("leaves unreplaced placeholders when variables are missing", () => {
    const result = renderTemplate(checkInTemplate, { firstName: "Alice" });
    expect(result.subject).toContain("{communityName}");
  });
});

describe("EMAIL_TEMPLATES", () => {
  it("contains exactly 4 templates", () => {
    expect(EMAIL_TEMPLATES).toHaveLength(4);
  });

  it("each template has required fields", () => {
    for (const t of EMAIL_TEMPLATES) {
      expect(t).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          subject: expect.any(String),
          body: expect.any(String),
          variables: expect.any(Array),
        })
      );
    }
  });
});

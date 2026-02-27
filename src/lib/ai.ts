import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error("Missing ANTHROPIC_API_KEY environment variable");
    }
    client = new Anthropic({ apiKey: key });
  }
  return client;
}

/**
 * Personalize an outreach message using Claude.
 * Used in Growth+ tier playbooks.
 */
export async function personalizeMessage(
  template: string,
  context: {
    memberName: string;
    communityName: string;
    riskFactors: string[];
    tenure: number;
  }
): Promise<string> {
  const ai = getAnthropicClient();

  const response = await ai.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You are a retention specialist. Personalize this outreach template for a community member.

Template: ${template}

Member context:
- Name: ${context.memberName}
- Community: ${context.communityName}
- Risk factors: ${context.riskFactors.join(", ")}
- Member for: ${context.tenure} days

Rewrite the template to be warm, personal, and address their specific situation. Keep it concise (2-3 short paragraphs max). Do not use placeholder brackets. Return only the personalized message text.`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type === "text") {
    return block.text;
  }
  return template;
}

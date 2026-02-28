import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

export function getAIClient(): GoogleGenerativeAI {
  if (!client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    client = new GoogleGenerativeAI(key);
  }
  return client;
}

/**
 * Personalize an outreach message using Gemini.
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
  const ai = getAIClient();
  const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `You are a retention specialist. Personalize this outreach template for a community member.

Template: ${template}

Member context:
- Name: ${context.memberName}
- Community: ${context.communityName}
- Risk factors: ${context.riskFactors.join(", ")}
- Member for: ${context.tenure} days

Rewrite the template to be warm, personal, and address their specific situation. Keep it concise (2-3 short paragraphs max). Do not use placeholder brackets. Return only the personalized message text.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  return text || template;
}

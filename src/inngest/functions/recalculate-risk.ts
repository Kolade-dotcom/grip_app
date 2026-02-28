import { inngest } from "../client";
import { createServerClient } from "@/lib/supabase";
import { calculateChurnRisk } from "@/lib/risk-scoring";

export const recalculateRisk = inngest.createFunction(
  { id: "recalculate-risk", name: "Recalculate Risk Scores" },
  { cron: "0 */6 * * *" },
  async () => {
    const supabase = createServerClient();

    const { data: communities } = await supabase
      .from("communities")
      .select("id");

    if (!communities || communities.length === 0) return { processed: 0 };

    let totalProcessed = 0;

    for (const community of communities) {
      const { data: members } = await supabase
        .from("members")
        .select("*")
        .eq("community_id", community.id)
        .in("subscription_status", ["active", "trialing", "past_due"]);

      if (!members) continue;

      for (const member of members) {
        const daysUntilRenewal = member.current_period_end
          ? Math.ceil(
              (new Date(member.current_period_end).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            )
          : null;

        const riskInput = {
          ...member,
          days_until_renewal: daysUntilRenewal,
          tenure_days: member.tenure_days ?? 0,
          cancel_at_period_end: member.cancel_at_period_end ?? false,
          recent_payment_failures: member.recent_payment_failures ?? 0,
          previous_cancellations: member.previous_cancellations ?? 0,
          has_engagement_data: member.has_engagement_data ?? false,
        };

        const result = calculateChurnRisk(riskInput);

        await supabase.from("risk_scores").upsert(
          {
            member_id: member.id,
            score: result.score,
            risk_level: result.level,
            risk_factors: result.factors,
            data_confidence: result.confidence,
            calculated_at: new Date().toISOString(),
          },
          { onConflict: "member_id" }
        );

        totalProcessed++;
      }
    }

    return { processed: totalProcessed };
  }
);

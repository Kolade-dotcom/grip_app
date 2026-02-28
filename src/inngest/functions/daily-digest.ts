import { inngest } from "../client";
import { createServerClient } from "@/lib/supabase";
import { getResend } from "@/lib/resend";

export const dailyDigest = inngest.createFunction(
  { id: "daily-digest", name: "Daily Digest Email" },
  { cron: "0 8 * * *" },
  async () => {
    const supabase = createServerClient();

    const { data: communities } = await supabase
      .from("communities")
      .select("id, name, creator_user_id, settings, member_count");

    if (!communities || communities.length === 0) return { sent: 0 };

    let sent = 0;

    for (const community of communities) {
      const settings = (community.settings ?? {}) as Record<string, unknown>;
      if (!settings.daily_digest_email) continue;

      const { data: riskScores } = await supabase
        .from("risk_scores")
        .select("risk_level")
        .in(
          "member_id",
          (
            await supabase
              .from("members")
              .select("id")
              .eq("community_id", community.id)
          ).data?.map((m) => m.id) ?? []
        );

      const counts = { critical: 0, high: 0, medium: 0, low: 0 };
      for (const rs of riskScores ?? []) {
        const lvl = rs.risk_level as keyof typeof counts;
        if (lvl in counts) counts[lvl]++;
      }

      try {
        const resend = getResend();
        await resend.emails.send({
          from: "Grip <digest@grip.app>",
          to: "creator@placeholder.com",
          subject: `Grip Daily Digest — ${community.name}`,
          html: `
            <h2>Daily Digest for ${community.name}</h2>
            <p><strong>${community.member_count}</strong> members tracked</p>
            <ul>
              <li>Critical: ${counts.critical}</li>
              <li>High: ${counts.high}</li>
              <li>Medium: ${counts.medium}</li>
              <li>Low: ${counts.low}</li>
            </ul>
            <p><a href="https://grip.app">Open Grip Dashboard</a></p>
          `,
        });
        sent++;
      } catch {
        // Email sending is best-effort
      }
    }

    return { sent };
  }
);

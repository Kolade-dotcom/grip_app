import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { PlaybookEnrollment, OutreachLogEntry } from "@/types/playbook";

interface PlaybookHistoryCardProps {
  enrollments: PlaybookEnrollment[];
  outreach: OutreachLogEntry[];
}

function outreachLabel(entry: OutreachLogEntry): string {
  const channelLabel =
    entry.channel === "email" ? "Email" :
    entry.channel === "whop_chat" ? "Whop Chat" :
    entry.channel === "discord_dm" ? "Discord DM" :
    entry.channel === "telegram" ? "Telegram" : "Manual";

  const subject = entry.subject ? ` "${entry.subject}"` : "";

  let status = "";
  if (entry.bounced) status = " — Bounced";
  else if (entry.responded_at) status = " — Responded \u2713";
  else if (entry.clicked_at) status = " — Clicked \u2713";
  else if (entry.opened_at) status = " — Opened \u2713";
  else if (entry.delivered_at) status = " — Delivered";

  return `${channelLabel}${subject}${status}`;
}

export function PlaybookHistoryCard({ enrollments, outreach }: PlaybookHistoryCardProps) {
  const activeEnrollment = enrollments.find((e) => e.status === "active");

  return (
    <Card>
      <div className="text-label font-bold mb-3.5 flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        Playbook & History
      </div>

      {activeEnrollment && (
        <div className="bg-accent-subtle border border-accent-border rounded-button p-[10px_12px] mb-3.5">
          <div className="text-xs font-semibold text-accent-text">
            {activeEnrollment.playbooks?.emoji ?? "\u26A1"}{" "}
            {activeEnrollment.playbooks?.name ?? "Active Playbook"}{" "}
            <span className="text-text-muted font-normal">
              — Step {activeEnrollment.current_step + 1}
            </span>
          </div>
        </div>
      )}

      {outreach.length > 0 ? (
        <div className="text-xs text-text-secondary leading-[1.8]">
          {outreach.slice(0, 8).map((entry) => (
            <div key={entry.id}>
              · {formatDate(entry.sent_at)} — {outreachLabel(entry)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-text-muted">
          No outreach history yet
        </div>
      )}
    </Card>
  );
}

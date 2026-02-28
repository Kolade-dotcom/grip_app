import type { Member } from "@/types/member";
import type { Community } from "@/types/community";
import { createServerClient } from "@/lib/supabase";
import { getResend } from "@/lib/resend";

type OutreachChannel = "email" | "whop_chat" | "discord_dm" | "telegram";

type OutreachContent = {
  subject?: string;
  body: string;
};

type OutreachOptions = {
  playbook_enrollment_id?: string;
  template_id?: string;
};

type OutreachResult = {
  channel: OutreachChannel | "none";
  success: boolean;
  error?: string;
};

export function canReach(
  member: Pick<Member, "email" | "discord_user_id" | "telegram_user_id">,
  channel: OutreachChannel,
  community: Pick<Community, "discord_bot_installed" | "telegram_bot_installed" | "whop_chat_enabled">
): boolean {
  switch (channel) {
    case "email":
      return !!member.email;
    case "whop_chat":
      return !!community.whop_chat_enabled;
    case "discord_dm":
      return !!member.discord_user_id && !!community.discord_bot_installed;
    case "telegram":
      return !!member.telegram_user_id && !!community.telegram_bot_installed;
    default:
      return false;
  }
}

async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: "Grip <notifications@grip.app>",
    to,
    subject,
    html: body,
  });
  if (error) throw new Error(error.message);
}

async function logOutreach(params: {
  member_id: string;
  community_id: string;
  channel: string;
  subject?: string;
  content: string;
  playbook_enrollment_id?: string;
  template_id?: string;
}): Promise<void> {
  const supabase = createServerClient();
  await supabase.from("outreach_log").insert({
    member_id: params.member_id,
    community_id: params.community_id,
    channel: params.channel,
    subject: params.subject,
    content: params.content,
    playbook_enrollment_id: params.playbook_enrollment_id ?? null,
    template_id: params.template_id ?? null,
    sent_at: new Date().toISOString(),
  });
}

export async function sendToMember(
  member: Member,
  community: Community,
  content: OutreachContent,
  options?: OutreachOptions
): Promise<OutreachResult> {
  const priority = (community.settings?.outreach_channel_priority ?? [
    "email",
    "whop_chat",
    "discord",
    "telegram",
  ]) as OutreachChannel[];

  for (const channel of priority) {
    if (!canReach(member, channel, community)) continue;

    try {
      if (channel === "email" && member.email) {
        await sendEmail(
          member.email,
          content.subject ?? "Message from your community",
          content.body
        );
      } else {
        continue;
      }

      await logOutreach({
        member_id: member.id,
        community_id: community.id,
        channel,
        subject: content.subject,
        content: content.body,
        playbook_enrollment_id: options?.playbook_enrollment_id,
        template_id: options?.template_id,
      });

      return { channel, success: true };
    } catch (err) {
      continue;
    }
  }

  return { channel: "none", success: false, error: "No reachable channel" };
}

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "check_in",
    name: "Check-In",
    subject: "Hey {firstName}, we miss you in {communityName}!",
    body: `<p>Hey {firstName},</p>
<p>We noticed you haven't been around <strong>{communityName}</strong> lately and wanted to check in.</p>
<p>We're always adding new content and features — there's a lot you might be missing out on!</p>
<p>Come say hi when you get a chance. We'd love to see you back.</p>
<p>— {creatorName}</p>`,
    variables: ["firstName", "communityName", "creatorName"],
  },
  {
    id: "renewal_reminder",
    name: "Renewal Reminder",
    subject: "Your {communityName} membership renews soon",
    body: `<p>Hey {firstName},</p>
<p>Just a heads up — your <strong>{planName}</strong> membership in <strong>{communityName}</strong> renews in {daysUntilRenewal} days.</p>
<p>If you have any questions or need help with anything, just reply to this email.</p>
<p>— {creatorName}</p>`,
    variables: [
      "firstName",
      "communityName",
      "planName",
      "daysUntilRenewal",
      "creatorName",
    ],
  },
  {
    id: "payment_recovery",
    name: "Payment Recovery",
    subject: "Action needed: update your payment for {communityName}",
    body: `<p>Hey {firstName},</p>
<p>We had trouble processing your payment for <strong>{communityName}</strong>.</p>
<p>To keep your access, please update your payment method here:</p>
<p><a href="{paymentUpdateLink}">Update Payment Method</a></p>
<p>If you need help, just reply to this email.</p>
<p>— {creatorName}</p>`,
    variables: [
      "firstName",
      "communityName",
      "paymentUpdateLink",
      "creatorName",
    ],
  },
  {
    id: "welcome_fast_start",
    name: "Welcome / Fast Start",
    subject: "Welcome to {communityName}! Here's how to get started",
    body: `<p>Hey {firstName}, welcome to <strong>{communityName}</strong>! 🎉</p>
<p>Here are 3 things to do in your first week:</p>
<ol>
<li>{onboardingStep1}</li>
<li>{onboardingStep2}</li>
<li>{onboardingStep3}</li>
</ol>
<p>If you have any questions, don't hesitate to reach out.</p>
<p>— {creatorName}</p>`,
    variables: [
      "firstName",
      "communityName",
      "creatorName",
      "onboardingStep1",
      "onboardingStep2",
      "onboardingStep3",
    ],
  },
];

export function renderTemplate(
  template: EmailTemplate,
  variables: Record<string, string>
): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    subject = subject.replaceAll(placeholder, value);
    body = body.replaceAll(placeholder, value);
  }
  return { subject, body };
}

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import crypto from "crypto";

/**
 * POST /api/whop/webhook
 * Handle Whop webhook events for membership changes and payments.
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("whop-signature");

    // Verify webhook signature
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { action, data } = event;

    const supabase = createServerClient();

    switch (action) {
      case "membership.went_valid":
        await handleMembershipValid(supabase, data);
        break;

      case "membership.went_invalid":
        await handleMembershipInvalid(supabase, data);
        break;

      case "membership.updated":
        await handleMembershipUpdated(supabase, data);
        break;

      case "payment.succeeded":
        await handlePaymentSucceeded(supabase, data);
        break;

      case "payment.failed":
        await handlePaymentFailed(supabase, data);
        break;

      case "payment.refunded":
        await handlePaymentRefunded(supabase, data);
        break;

      default:
        // Unhandled event type — acknowledge without processing
        break;
    }

    // Log the event
    const companyId = data?.company_id ?? data?.membership?.company?.id;
    if (companyId) {
      const { data: community } = await supabase
        .from("communities")
        .select("id")
        .eq("whop_company_id", companyId)
        .single();

      if (community) {
        await supabase.from("events").insert({
          community_id: community.id,
          member_id: null, // Could be resolved but not critical for logging
          event_type: action,
          event_data: data,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Verify the Whop webhook signature using HMAC-SHA256.
 */
function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// ── Event Handlers ──

/**
 * New member or reactivation — upsert into members table.
 */
async function handleMembershipValid(
  supabase: ReturnType<typeof createServerClient>,
  data: WebhookMembershipData
) {
  const community = await findCommunity(supabase, data.company_id);
  if (!community) return;

  const now = new Date().toISOString();
  const memberData = mapMembershipToMember(community.id, data, "active", now);

  const { data: existing } = await supabase
    .from("members")
    .select("id, previous_cancellations")
    .eq("community_id", community.id)
    .eq("whop_membership_id", data.id)
    .single();

  if (existing) {
    // Reactivation
    await supabase
      .from("members")
      .update({ ...memberData, subscription_status: "active" })
      .eq("id", existing.id);
  } else {
    // Brand new member
    await supabase.from("members").insert({
      ...memberData,
      previous_cancellations: 0,
      recent_payment_failures: 0,
      has_engagement_data: false,
      created_at: now,
    });

    // Update community member count
    await supabase.rpc("increment_member_count", { community_row_id: community.id });
  }
}

/**
 * Member cancelled or expired.
 */
async function handleMembershipInvalid(
  supabase: ReturnType<typeof createServerClient>,
  data: WebhookMembershipData
) {
  const community = await findCommunity(supabase, data.company_id);
  if (!community) return;

  const { data: existing } = await supabase
    .from("members")
    .select("id, previous_cancellations")
    .eq("community_id", community.id)
    .eq("whop_membership_id", data.id)
    .single();

  if (existing) {
    await supabase
      .from("members")
      .update({
        subscription_status: "cancelled",
        cancel_at_period_end: false,
        previous_cancellations: (existing.previous_cancellations ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  }
}

/**
 * Membership updated — plan change, status change, etc.
 */
async function handleMembershipUpdated(
  supabase: ReturnType<typeof createServerClient>,
  data: WebhookMembershipData
) {
  const community = await findCommunity(supabase, data.company_id);
  if (!community) return;

  const now = new Date().toISOString();
  const status = mapWhopStatus(data.status);
  const memberData = mapMembershipToMember(community.id, data, status, now);

  await supabase
    .from("members")
    .update(memberData)
    .eq("community_id", community.id)
    .eq("whop_membership_id", data.id);
}

/**
 * Payment succeeded — reset failure count.
 */
async function handlePaymentSucceeded(
  supabase: ReturnType<typeof createServerClient>,
  data: WebhookPaymentData
) {
  if (!data.membership_id) return;

  await supabase
    .from("members")
    .update({
      recent_payment_failures: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("whop_membership_id", data.membership_id);
}

/**
 * Payment failed — increment failure count (triggers risk recalc).
 */
async function handlePaymentFailed(
  supabase: ReturnType<typeof createServerClient>,
  data: WebhookPaymentData
) {
  if (!data.membership_id) return;

  const { data: member } = await supabase
    .from("members")
    .select("id, recent_payment_failures")
    .eq("whop_membership_id", data.membership_id)
    .single();

  if (member) {
    await supabase
      .from("members")
      .update({
        recent_payment_failures: (member.recent_payment_failures ?? 0) + 1,
        subscription_status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id);
  }
}

/**
 * Payment refunded — log but don't change status.
 */
async function handlePaymentRefunded(
  supabase: ReturnType<typeof createServerClient>,
  data: WebhookPaymentData
) {
  // Refunds are logged via the event log above.
  // No member status change needed — Whop will send
  // membership.went_invalid if the membership is terminated.
  if (!data.membership_id) return;

  await supabase
    .from("members")
    .update({ updated_at: new Date().toISOString() })
    .eq("whop_membership_id", data.membership_id);
}

// ── Helpers ──

async function findCommunity(
  supabase: ReturnType<typeof createServerClient>,
  whopCompanyId: string
) {
  const { data } = await supabase
    .from("communities")
    .select("id")
    .eq("whop_company_id", whopCompanyId)
    .single();
  return data;
}

function mapWhopStatus(status: string): "active" | "cancelled" | "past_due" | "trialing" {
  switch (status) {
    case "active": return "active";
    case "trialing": return "trialing";
    case "past_due":
    case "unresolved": return "past_due";
    default: return "cancelled";
  }
}

function mapMembershipToMember(
  communityId: string,
  data: WebhookMembershipData,
  status: string,
  now: string
) {
  return {
    community_id: communityId,
    whop_membership_id: data.id,
    whop_user_id: data.user?.id ?? "",
    email: data.user?.email ?? null,
    username: data.user?.username ?? null,
    first_name: data.user?.name ?? null,
    subscription_status: status,
    plan_id: data.plan?.id ?? null,
    plan_name: data.product?.title ?? null,
    cancel_at_period_end: data.cancel_at_period_end ?? false,
    current_period_start: data.renewal_period_start ?? null,
    current_period_end: data.renewal_period_end ?? null,
    updated_at: now,
  };
}

// ── Types for webhook payloads ──

type WebhookMembershipData = {
  id: string;
  company_id: string;
  status: string;
  cancel_at_period_end: boolean;
  renewal_period_start: string | null;
  renewal_period_end: string | null;
  plan: { id: string } | null;
  product: { id: string; title: string } | null;
  user: { id: string; email: string | null; name: string | null; username: string } | null;
};

type WebhookPaymentData = {
  id: string;
  membership_id: string | null;
  company_id: string;
  amount: number;
  currency: string;
};

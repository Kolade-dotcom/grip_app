import { whopApi } from "@/lib/whop";
import { createServerClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Sync all memberships from Whop API into our members table for a community.
 * Uses the memberships endpoint (not members) because it has renewal dates,
 * subscription status, and billing data we need for risk scoring.
 */
export async function syncWhopMembers(communityId: string, whopCompanyId: string) {
  const supabase = createServerClient();

  let synced = 0;
  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  try {
    const membershipsPage = await whopApi.memberships.list({
      company_id: whopCompanyId,
      first: 100,
    });

    for await (const membership of membershipsPage) {
      try {
        const result = await upsertMember(supabase, communityId, membership);
        synced++;
        if (result === "created") created++;
        else updated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`membership ${membership.id}: ${msg}`);
      }
    }

    // Update community member count
    await supabase
      .from("communities")
      .update({ member_count: synced, updated_at: new Date().toISOString() })
      .eq("id", communityId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch memberships from Whop: ${msg}`);
  }

  return { synced, created, updated, errors };
}

/**
 * Upsert a single Whop membership into our members table.
 */
async function upsertMember(
  supabase: SupabaseClient,
  communityId: string,
  membership: WhopMembership
): Promise<"created" | "updated"> {
  const now = new Date().toISOString();

  // Map Whop status to our simplified status
  const status = mapStatus(membership.status);

  // Calculate tenure from joined_at
  const tenureDays = membership.joined_at
    ? Math.floor((Date.now() - parseTimestamp(membership.joined_at)) / (1000 * 60 * 60 * 24))
    : null;

  const memberData = {
    community_id: communityId,
    whop_membership_id: membership.id,
    whop_user_id: membership.user?.id ?? "",
    email: membership.user?.email ?? null,
    username: membership.user?.username ?? null,
    first_name: membership.user?.name ?? null,
    subscription_status: status,
    plan_id: membership.plan?.id ?? null,
    plan_name: membership.product?.title ?? null,
    plan_price_cents: null, // Not directly on membership object
    current_period_start: parseTimestampToISO(membership.renewal_period_start),
    current_period_end: parseTimestampToISO(membership.renewal_period_end),
    cancel_at_period_end: membership.cancel_at_period_end ?? false,
    ltv_cents: 0, // Will be set from members endpoint or payments
    tenure_days: tenureDays,
    updated_at: now,
  };

  // Check if member already exists
  const { data: existing } = await supabase
    .from("members")
    .select("id")
    .eq("community_id", communityId)
    .eq("whop_membership_id", membership.id)
    .single();

  if (existing) {
    await supabase
      .from("members")
      .update(memberData)
      .eq("id", existing.id);
    return "updated";
  } else {
    await supabase
      .from("members")
      .insert({
        ...memberData,
        previous_cancellations: 0,
        recent_payment_failures: 0,
        has_engagement_data: false,
        created_at: now,
      });
    return "created";
  }
}

/**
 * Sync LTV data from the Whop members endpoint (has usd_total_spent).
 */
export async function syncMemberLTV(communityId: string, whopCompanyId: string) {
  const supabase = createServerClient();

  try {
    const membersPage = await whopApi.members.list({
      company_id: whopCompanyId,
      first: 100,
    });

    for await (const member of membersPage) {
      if (!member.user?.id) continue;

      await supabase
        .from("members")
        .update({ ltv_cents: member.usd_total_spent ?? 0 })
        .eq("community_id", communityId)
        .eq("whop_user_id", member.user.id);
    }
  } catch {
    // LTV sync is supplementary — don't fail the whole sync
  }
}

/**
 * Map Whop's membership status to our simplified set.
 */
function mapStatus(
  whopStatus: string
): "active" | "cancelled" | "past_due" | "trialing" {
  switch (whopStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
    case "unresolved":
      return "past_due";
    case "canceled":
    case "canceling":
    case "completed":
    case "expired":
      return "cancelled";
    default:
      return "cancelled";
  }
}

/**
 * Parse a Whop timestamp (unix seconds string or ISO) to ms.
 */
function parseTimestamp(ts: string | null): number {
  if (!ts) return 0;
  // Whop uses unix seconds for some fields
  const num = Number(ts);
  if (!isNaN(num) && num < 1e12) return num * 1000;
  return new Date(ts).getTime();
}

/**
 * Parse a Whop timestamp to ISO string.
 */
function parseTimestampToISO(ts: string | null): string | null {
  if (!ts) return null;
  const ms = parseTimestamp(ts);
  if (ms === 0) return null;
  return new Date(ms).toISOString();
}

// Minimal type for the membership object from Whop SDK
type WhopMembership = {
  id: string;
  status: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  joined_at: string | null;
  renewal_period_start: string | null;
  renewal_period_end: string | null;
  plan: { id: string } | null;
  product: { id: string; title: string } | null;
  user: { id: string; email: string | null; name: string | null; username: string } | null;
};

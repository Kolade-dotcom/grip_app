import type { Member } from "@/types/member";
import type { RiskFactor, RiskResult } from "@/types/risk";

/**
 * Calculate churn risk score for a member.
 * V1 works with Whop API data only — no engagement data required.
 */
export function calculateChurnRisk(
  member: Member & {
    days_until_renewal?: number | null;
    engagement_score?: number;
  }
): RiskResult {
  let score = 0;
  const factors: RiskFactor[] = [];

  const daysUntilRenewal = member.days_until_renewal ?? null;

  // 1. RENEWAL PROXIMITY + CANCELLATION (0-25 points)
  if (daysUntilRenewal !== null && daysUntilRenewal <= 7 && daysUntilRenewal > 0) {
    score += 15;
    factors.push({
      factor: "renewal_imminent",
      severity: "high",
      points: 15,
      description: `Renewal in ${daysUntilRenewal} days`,
    });
  }

  if (member.cancel_at_period_end) {
    score += 10;
    factors.push({
      factor: "cancellation_scheduled",
      severity: "critical",
      points: 10,
      description: "Cancellation scheduled at period end",
    });
  }

  // 2. PAYMENT FAILURES (0-25 points)
  if (member.recent_payment_failures > 0) {
    const pts = member.recent_payment_failures >= 2 ? 25 : 20;
    score += pts;
    factors.push({
      factor: "payment_failure",
      severity: "critical",
      points: pts,
      description: `${member.recent_payment_failures} failed payment(s) in last 30 days`,
    });
  }

  // 3. EARLY LIFECYCLE RISK (0-20 points)
  const tenure = member.tenure_days ?? 0;
  if (tenure < 14) {
    score += 10;
    factors.push({
      factor: "new_member",
      severity: "medium",
      points: 10,
      description: `Joined ${tenure} days ago — critical onboarding window`,
    });
    if (!member.has_engagement_data) {
      score += 10;
      factors.push({
        factor: "no_engagement_visibility",
        severity: "medium",
        points: 10,
        description: "No engagement tracking — consider connecting Discord",
      });
    }
  }

  // 4. FIRST RENEWAL APPROACHING (0-15 points)
  if (tenure < 35 && daysUntilRenewal !== null && daysUntilRenewal <= 10) {
    score += 15;
    factors.push({
      factor: "first_renewal",
      severity: "high",
      points: 15,
      description: "First renewal approaching — highest churn risk period",
    });
  }

  // 5. PREVIOUS CANCELLATIONS (0-10 points)
  if (member.previous_cancellations > 0) {
    score += 10;
    factors.push({
      factor: "previous_cancellation",
      severity: "medium",
      points: 10,
      description: `Previously cancelled ${member.previous_cancellations} time(s)`,
    });
  }

  // 6. ENGAGEMENT DATA — bonus when Layer 2/3/4 connected (0-30 points)
  if (member.has_engagement_data && member.engagement_score !== undefined) {
    if (member.engagement_score < 15) {
      score += 20;
      factors.push({
        factor: "very_low_engagement",
        severity: "high",
        points: 20,
        description: "Engagement significantly below community average",
      });
    } else if (member.engagement_score < 30) {
      score += 10;
      factors.push({
        factor: "declining_engagement",
        severity: "medium",
        points: 10,
        description: "Engagement declining over recent weeks",
      });
    }
  }

  // Cap at 100
  score = Math.min(score, 100);

  // Determine level
  const level =
    score >= 70
      ? "critical"
      : score >= 40
        ? "high"
        : score >= 20
          ? "medium"
          : "low";

  // Confidence based on data available
  const confidence = member.has_engagement_data
    ? "high"
    : tenure > 30
      ? "medium"
      : "low";

  return { score, level, factors, confidence };
}

/**
 * Compute days until renewal from period end date.
 */
export function daysUntilRenewal(periodEnd: string | null): number | null {
  if (!periodEnd) return null;
  const end = new Date(periodEnd);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

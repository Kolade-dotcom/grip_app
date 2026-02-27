export const PLAN_LIMITS = {
  free: {
    maxMembers: 50,
    playbooks: 0,
    manualEmails: 0,
    automatedOutreach: false,
    discordIntegration: false,
    telegramIntegration: false,
    aiPersonalization: false,
    abTesting: false,
    price: 0,
    label: "Free",
  },
  starter: {
    maxMembers: 500,
    playbooks: 1,
    manualEmails: Infinity,
    automatedOutreach: false,
    discordIntegration: true,
    telegramIntegration: false,
    aiPersonalization: false,
    abTesting: false,
    price: 49,
    label: "Starter",
  },
  growth: {
    maxMembers: 2000,
    playbooks: 3,
    manualEmails: Infinity,
    automatedOutreach: true,
    discordIntegration: true,
    telegramIntegration: true,
    aiPersonalization: true,
    abTesting: true,
    price: 149,
    label: "Growth",
  },
  pro: {
    maxMembers: Infinity,
    playbooks: Infinity,
    manualEmails: Infinity,
    automatedOutreach: true,
    discordIntegration: true,
    telegramIntegration: true,
    aiPersonalization: true,
    abTesting: true,
    price: 299,
    label: "Pro",
  },
  enterprise: {
    maxMembers: Infinity,
    playbooks: Infinity,
    manualEmails: Infinity,
    automatedOutreach: true,
    discordIntegration: true,
    telegramIntegration: true,
    aiPersonalization: true,
    abTesting: true,
    multiCommunity: true,
    whiteLabel: true,
    price: 999,
    label: "Enterprise",
  },
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

type PlanFeature = keyof (typeof PLAN_LIMITS)["free"];

export function canAccess(tier: PlanTier, feature: PlanFeature): boolean {
  return !!PLAN_LIMITS[tier][feature];
}

export function getUpgradeTier(current: PlanTier): PlanTier | null {
  const order: PlanTier[] = ["free", "starter", "growth", "pro", "enterprise"];
  const idx = order.indexOf(current);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

export function getPlanLabel(tier: PlanTier): string {
  return PLAN_LIMITS[tier].label;
}

export function getPlanPrice(tier: PlanTier): number {
  return PLAN_LIMITS[tier].price;
}

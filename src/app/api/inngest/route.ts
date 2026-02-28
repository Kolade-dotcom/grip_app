import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { recalculateRisk } from "@/inngest/functions/recalculate-risk";
import { executePlaybookSteps } from "@/inngest/functions/execute-playbook-steps";
import { syncWhopData } from "@/inngest/functions/sync-whop-data";
import { dailyDigest } from "@/inngest/functions/daily-digest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [recalculateRisk, executePlaybookSteps, syncWhopData, dailyDigest],
});

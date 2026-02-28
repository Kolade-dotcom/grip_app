import { inngest } from "../client";
import { executePendingSteps } from "@/lib/playbook-engine";

export const executePlaybookSteps = inngest.createFunction(
  { id: "execute-playbook-steps", name: "Execute Pending Playbook Steps" },
  { cron: "*/15 * * * *" },
  async () => {
    const result = await executePendingSteps();
    return result;
  }
);

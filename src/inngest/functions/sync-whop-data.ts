import { inngest } from "../client";
import { createServerClient } from "@/lib/supabase";
import { syncWhopMembers, syncMemberLTV } from "@/lib/sync";

export const syncWhopData = inngest.createFunction(
  { id: "sync-whop-data", name: "Sync Whop Member Data" },
  { cron: "0 */4 * * *" },
  async () => {
    const supabase = createServerClient();

    const { data: communities } = await supabase
      .from("communities")
      .select("id, whop_company_id");

    if (!communities || communities.length === 0) return { synced: 0 };

    let totalSynced = 0;
    const errors: string[] = [];

    for (const community of communities) {
      try {
        const result = await syncWhopMembers(
          community.id,
          community.whop_company_id
        );
        totalSynced += result.synced;

        await syncMemberLTV(community.id, community.whop_company_id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${community.id}: ${msg}`);
      }
    }

    return { synced: totalSynced, errors };
  }
);

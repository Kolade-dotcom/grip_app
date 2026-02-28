import { NextResponse } from "next/server";
import { executePendingSteps } from "@/lib/playbook-engine";

export async function POST() {
  try {
    const result = await executePendingSteps();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

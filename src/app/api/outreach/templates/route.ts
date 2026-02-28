import { NextResponse } from "next/server";
import { EMAIL_TEMPLATES } from "@/lib/outreach";

export async function GET() {
  return NextResponse.json({ templates: EMAIL_TEMPLATES });
}

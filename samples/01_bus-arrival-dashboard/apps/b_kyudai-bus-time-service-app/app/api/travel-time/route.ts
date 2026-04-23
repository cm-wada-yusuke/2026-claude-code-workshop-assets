import { NextResponse } from "next/server";
import { aggregateTravelTime } from "@/lib/aggregate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const from = new URL(req.url).searchParams.get("from") ?? undefined;
    const data = aggregateTravelTime(from);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/travel-time] aggregation failed", err);
    return NextResponse.json(
      { error: "CSV 集計に失敗しました", detail: String(err) },
      { status: 500 }
    );
  }
}

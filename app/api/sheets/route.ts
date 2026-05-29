import { NextRequest, NextResponse } from "next/server";

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ?? "";

export async function GET(req: NextRequest) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json(
      { success: false, error: "NEXT_PUBLIC_APPS_SCRIPT_URL is not configured" },
      { status: 500 }
    );
  }

  const params = req.nextUrl.searchParams.toString();
  const url = `${APPS_SCRIPT_URL}?${params}`;

  try {
    const res = await fetch(url, { redirect: "follow", cache: "no-store" });
    const text = await res.text();
    console.log("[sheets proxy] status:", res.status, "body:", text.slice(0, 300));
    return NextResponse.json(JSON.parse(text));
  } catch (e) {
    console.error("[sheets proxy] error fetching", url, e);
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Proxy error" },
      { status: 500 }
    );
  }
}

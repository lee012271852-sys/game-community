import { NextRequest, NextResponse } from "next/server";
import { fetchGameMecaList, NewsCategory } from "@/lib/gamemeca";

export async function GET(req: NextRequest) {
  try {
    const category =
      (req.nextUrl.searchParams.get("category") as NewsCategory) || "main";

    const allowed: NewsCategory[] = [
      "main",
      "industry",
      "esports",
      "pc",
      "mobile",
      "console",
    ];

    if (!allowed.includes(category)) {
      return NextResponse.json(
        { error: "지원하지 않는 카테고리입니다." },
        { status: 400 }
      );
    }

    const items = await fetchGameMecaList(category);
    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("gamemeca list api error:", error);

    return NextResponse.json(
      {
        error: "기사 목록을 가져오지 못했습니다.",
        detail: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
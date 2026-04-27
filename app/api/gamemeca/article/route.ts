import { NextRequest, NextResponse } from "next/server";
import { fetchGameMecaArticle } from "@/lib/gamemeca";

export async function GET(req: NextRequest) {
  try {
    const articleUrl = req.nextUrl.searchParams.get("url");

    if (!articleUrl) {
      return NextResponse.json(
        { error: "url 파라미터가 필요합니다." },
        { status: 400 }
      );
    }

    const article = await fetchGameMecaArticle(articleUrl);
    return NextResponse.json(article);
  } catch (error) {
    console.error("gamemeca article api error:", error);

    return NextResponse.json(
      {
        error: "기사 본문을 가져오지 못했습니다.",
        detail: error instanceof Error ? error.message : "unknown error",
      },
      { status: 500 }
    );
  }
}
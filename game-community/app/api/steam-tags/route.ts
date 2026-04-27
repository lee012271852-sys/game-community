// app/api/steam-tags/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');

  if (!appId) {
    return NextResponse.json({ error: 'App ID missing' }, { status: 400 });
  }

  try {
    // 스팀 상점 API 호출 (게임 상세 정보)
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=koreana`);
    
    // 응답이 HTML일 경우를 대비해 텍스트로 먼저 받음
    const text = await res.text();

    try {
      const data = JSON.parse(text); // JSON 변환 시도
      return NextResponse.json(data);
    } catch (e) {
      console.error("JSON 파싱 에러 (스팀 API 차단 가능성):", text.substring(0, 100));
      return NextResponse.json({ error: 'Invalid JSON from Steam' }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Server Fetch Error' }, { status: 500 });
  }
}
// app/api/steam/sync/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { steamId, userId } = await req.json();

    if (!steamId || !userId) {
      return NextResponse.json({ error: '스팀 ID 또는 유저 ID가 없습니다.' }, { status: 400 });
    }

    const STEAM_API_KEY = process.env.STEAM_API_KEY;
    
    // 1. 스팀 API 호출: 보유 게임 목록 가져오기 (include_appinfo=1 옵션으로 게임 이름과 아이콘 이미지까지 한 번에 가져옵니다)
    const steamUrl = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&format=json&include_appinfo=1`;
    const steamRes = await fetch(steamUrl);
    const steamData = await steamRes.json();

    // 프로필이 비공개거나 게임이 하나도 없는 경우 처리
    if (!steamData.response || !steamData.response.games) {
      return NextResponse.json({ error: '스팀 프로필이 비공개로 설정되어 있거나 게임 내역이 없습니다.' }, { status: 403 });
    }

    const games = steamData.response.games;

    // 2. Supabase 서버 클라이언트 생성
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 3. user_profiles 테이블 갱신 (연동된 스팀 ID와 최근 동기화 시간 저장)
    await supabase
      .from('user_profiles')
      .update({
        steam_id: steamId,
        last_steam_sync: new Date().toISOString(),
      })
      .eq('id', userId);

    // 4. 기존 보유 게임 데이터 싹 비우기 (중복 방지를 위한 초기화)
    await supabase
      .from('user_owned_games')
      .delete()
      .eq('user_id', userId);

    // 5. 새로 가져온 스팀 게임 데이터를 DB 형식에 맞게 가공
    const insertData = games.map((g: any) => ({
      user_id: userId,
      appid: g.appid,
      game_title: g.name,
      playtime_forever: g.playtime_forever,
      // 스팀의 공식 이미지 URL 포맷
      img_icon_url: g.img_icon_url ? `http://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg` : null,
    }));

    // 6. 가공된 데이터를 user_owned_games 테이블에 일괄(Bulk) 저장
    const { error: insertError } = await supabase.from('user_owned_games').insert(insertData);
    
    if (insertError) throw insertError;

    // 완료 응답!
    return NextResponse.json({ 
      message: '스팀 연동 및 데이터 동기화 완료!', 
      gameCount: games.length 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Steam Sync Error:', error);
    return NextResponse.json({ error: '서버 통신 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
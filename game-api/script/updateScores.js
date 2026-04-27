const fetch = require('node-fetch');
const supabase = require('./supabase');

// RapidAPI 키 (없으면 비워둡니다)
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || ""; 

// 봇 차단 방지 헤더
const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://opencritic.com/',
  'Origin': 'https://opencritic.com'
};

// 1. 스팀에서 영어 제목 가져오기
async function getEnglishTitle(appId) {
  try {
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`, { headers: COMMON_HEADERS });
    const data = await res.json();
    if (data[appId] && data[appId].success) {
      return data[appId].data.name;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// 2. 오픈크리틱 (주소 수정됨: meta/search)
async function fetchOpenCritic(title) {
  try {
    // 검색
    const searchUrl = `https://api.opencritic.com/api/meta/search?criteria=${encodeURIComponent(title)}`;
    const searchRes = await fetch(searchUrl, { headers: COMMON_HEADERS });
    
    if (!searchRes.ok) return null;

    const searchResults = await searchRes.json();
    if (!searchResults || searchResults.length === 0) return null;

    // 가장 정확한 결과 찾기
    const gameId = searchResults[0].id;

    // 상세 정보 조회
    const detailUrl = `https://api.opencritic.com/api/game/${gameId}`;
    const detailRes = await fetch(detailUrl, { headers: COMMON_HEADERS });
    const info = await detailRes.json();

    return info.medianScore ? Math.round(info.medianScore) : null; 
  } catch (e) {
    return null;
  }
}

// 3. 메타크리틱 (RapidAPI 키 체크)
async function fetchMetacritic(title) {
  // 키가 없거나 기본값이면 실행하지 않음
  if (!RAPIDAPI_KEY || RAPIDAPI_KEY.startsWith("process.env")) return null;
  
  try {
    const url = `https://metacriticapi.p.rapidapi.com/search/${encodeURIComponent(title)}`;
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "metacriticapi.p.rapidapi.com"
      },
    });
    
    if (!res.ok) return null;
    const json = await res.json();
    
    if (json && json.length > 0 && json[0].score) {
        return parseInt(json[0].score);
    }
    return null; 
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log("🚀 게임 점수 업데이트 시작...");

  // 1. DB에서 게임 가져오기
  const { data: games, error } = await supabase.from('games').select('*');
  if (error) {
    console.error("❌ DB 에러:", error.message);
    return;
  }

  console.log(`🎮 총 ${games.length}개 게임 처리 중...`);

  let count = 0;

  for (const game of games) {
    // 스팀 ID 추출
    const appIdMatch = game.image_url?.match(/\/apps\/(\d+)\//);
    if (!appIdMatch) continue;
    const appId = appIdMatch[1];

    // 영어 제목 변환
    const englishTitle = await getEnglishTitle(appId);
    const searchTitle = englishTitle || game.title;

    process.stdout.write(`🔍 [${game.title}] `);

    // 점수 조회
    const open = await fetchOpenCritic(searchTitle);
    const meta = await fetchMetacritic(searchTitle);

    // 결과 출력 및 저장
    if (open !== null || meta !== null) {
      await supabase
        .from('games')
        .update({ 
          metacritic_score: meta, 
          opencritic_score: open 
        })
        .eq('id', game.id);
        
      console.log(`✅ 저장 완료 (OpenCritic: ${open ?? '없음'}, Metacritic: ${meta ?? '키 없음'})`);
      count++;
    } else {
      console.log(`⚠️ 점수 못 찾음`);
    }

    // 1초 대기
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`🎉 완료! 총 ${count}개 게임 점수 업데이트됨.`);
}

main();
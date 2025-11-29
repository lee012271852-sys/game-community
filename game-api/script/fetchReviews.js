const fetch = require('node-fetch');
const supabase = require('./supabase');

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://opencritic.com/',
  'Origin': 'https://opencritic.com'
};

async function fetchOpenCriticId(title) {
  try {
    const searchUrl = `https://api.opencritic.com/api/meta/search?criteria=${encodeURIComponent(title)}`;
    const res = await fetch(searchUrl, { headers: COMMON_HEADERS });
    if (!res.ok) return null;
    const results = await res.json();
    return (results && results.length > 0) ? results[0].id : null;
  } catch (e) {
    return null;
  }
}

async function fetchCriticReviews(openCriticGameId) {
  try {
    // 오픈크리틱 리뷰 목록 엔드포인트
    const url = `https://api.opencritic.com/api/review/game/${openCriticGameId}`;
    const res = await fetch(url, { headers: COMMON_HEADERS });
    if (!res.ok) return [];
    const reviews = await res.json();
    return reviews;
  } catch (e) {
    return [];
  }
}

async function main() {
  console.log("🚀 전문가 평론 수집 시작...");

  // 1. 우리 DB에서 게임 목록 가져오기
  const { data: games, error } = await supabase.from('games').select('*');
  if (error) return console.error("DB 에러:", error.message);

  let totalSaved = 0;

  for (const game of games) {
    // 2. 오픈크리틱 ID 찾기 (점수 데이터에 저장된 게 있으면 좋겠지만, 없으면 검색)
    // (이미지를 통해 스팀 ID -> 제목 -> 오픈크리틱 ID 찾는 과정 생략하고 바로 제목 검색)
    const openCriticId = await fetchOpenCriticId(game.title);

    if (!openCriticId) {
      console.log(`⏩ [${game.title}] 오픈크리틱 정보 없음`);
      continue;
    }

    process.stdout.write(`🔍 [${game.title}] 리뷰 수집 중... `);

    // 3. 리뷰 데이터 가져오기
    const reviews = await fetchCriticReviews(openCriticId);
    
    // 4. 상위 3개만 저장 (너무 많으면 지저분함)
    const topReviews = reviews.slice(0, 3).map(r => ({
      game_id: game.id,
      outlet: r.Outlet ? r.Outlet.name : "Unknown",
      author: r.Authors && r.Authors.length > 0 ? r.Authors[0].name : "",
      rating: r.score,
      content: r.snippet, // 리뷰 요약 (핵심!)
      url: r.externalUrl
    })).filter(r => r.content); // 내용 있는 것만

    if (topReviews.length > 0) {
      const { error: insertError } = await supabase
        .from('critic_reviews')
        .insert(topReviews);
      
      if (insertError) console.log("❌ 저장 실패");
      else {
        console.log(`✅ ${topReviews.length}개 저장 완료`);
        totalSaved += topReviews.length;
      }
    } else {
      console.log("⚠️ 리뷰 없음");
    }

    // 차단 방지 딜레이
    
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`🎉 작업 끝! 총 ${totalSaved}개의 평론을 저장했습니다.`);
}

main();
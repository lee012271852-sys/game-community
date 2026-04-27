const fetch = require('node-fetch');
const supabase = require('./supabase');

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://opencritic.com/',
  'Origin': 'https://opencritic.com'
};

// 1. 오픈크리틱 검색 함수
async function fetchOpenCriticId(title) {
  try {
    // 특수기호(™, ®) 제거 및 인코딩
    const cleanTitle = title.replace(/[™®]/g, '').trim();
    const searchUrl = `https://api.opencritic.com/api/meta/search?criteria=${encodeURIComponent(cleanTitle)}`;
    
    const res = await fetch(searchUrl, { headers: COMMON_HEADERS });
    if (!res.ok) return null;
    
    const results = await res.json();
    return (results && results.length > 0) ? results[0].id : null;
  } catch (e) {
    return null;
  }
}

// ⭐ 2. 스팀 API를 이용해 영어 이름 가져오는 마법의 함수!
async function getSteamEnglishName(appId) {
  try {
    // l=english 옵션을 주면 스팀에서 무조건 영어 이름을 줍니다.
    const res = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=english`);
    const json = await res.json();
    if (json[appId] && json[appId].success) {
      return json[appId].data.name;
    }
  } catch (e) {
    return null;
  }
  return null;
}

// 3. 전문가 리뷰 가져오는 함수
async function fetchCriticReviews(openCriticGameId) {
  try {
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

  const { data: games, error } = await supabase.from('games').select('*');
  if (error) return console.error("DB 에러:", error.message);

  let totalSaved = 0;

  for (const game of games) {
    process.stdout.write(`🔍 [${game.title}] 확인 중... `);

    // 1단계: 일단 우리 DB에 있는 이름(한글/특수기호)으로 검색 시도
    let openCriticId = await fetchOpenCriticId(game.title);

    // 2단계: 실패했다면? 스팀 이미지 주소에서 AppID를 뽑아 영어 이름을 알아낸 뒤 재검색!
    if (!openCriticId && game.image_url) {
      const appIdMatch = game.image_url.match(/\/apps\/(\d+)\//);
      if (appIdMatch) {
        const steamAppId = appIdMatch[1];
        const englishName = await getSteamEnglishName(steamAppId);
        
        if (englishName && englishName !== game.title) {
          process.stdout.write(`\n   🔄 영문명(${englishName})으로 재검색 중... `);
          openCriticId = await fetchOpenCriticId(englishName);
        }
      }
    }

    if (!openCriticId) {
      console.log(`⏩ 오픈크리틱 정보 없음 (검색 실패)`);
      continue;
    }

    // 3단계: 리뷰 데이터 가져오기
    const reviews = await fetchCriticReviews(openCriticId);
    
    // 4단계: 상위 3개만 정제
    const topReviews = reviews.slice(0, 3).map(r => ({
      game_id: game.id,
      outlet: r.Outlet ? r.Outlet.name : "Unknown",
      author: r.Authors && r.Authors.length > 0 ? r.Authors[0].name : "",
      rating: r.score || 0, // 점수가 비어있으면 0 처리
      content: r.snippet, 
      url: r.externalUrl
    })).filter(r => r.content); // 내용이 비어있는 리뷰는 버림

    if (topReviews.length > 0) {
      const { error: insertError } = await supabase
        .from('critic_reviews')
        .insert(topReviews);
      
      if (insertError) console.log("❌ 저장 실패:", insertError.message);
      else {
        console.log(`✅ ${topReviews.length}개 저장 완료`);
        totalSaved += topReviews.length;
      }
    } else {
      console.log("⚠️ 리뷰 없음");
    }

    // 서버 차단 방지 딜레이 (1초)
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`🎉 작업 끝! 총 ${totalSaved}개의 전문가 평론을 저장했습니다.`);
}

main();
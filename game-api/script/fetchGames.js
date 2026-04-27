// script/fetchGames.js
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const supabase = require('./supabase');

// 1. 설정
const TARGET_COUNT = 200; // 가져올 게임 수

// 2. 딜레이 함수 (차단 방지)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ⭐ 3. 날짜 변환 함수 추가 (한국어 날짜 -> DB 형식)
// 예: "2023년 12월 8일" -> "2023-12-08"
function parseKoreanDate(dateStr) {
  if (!dateStr) return null;
  try {
    // 년, 월, 일 글자 제거 및 공백 기준 분리
    const parts = dateStr.replace(/년|월|일/g, '').trim().split(/\s+/);
    
    // 연/월/일 3조각이 아니면(예: "출시 예정") null 반환
    if (parts.length < 3) return null;

    const y = parts[0];
    const m = parts[1].padStart(2, '0'); // 한 자리 월을 두 자리로 (1 -> 01)
    const d = parts[2].padStart(2, '0'); // 한 자리 일을 두 자리로 (5 -> 05)
    
    return `${y}-${m}-${d}`;
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('🚀 스팀 인기 게임 데이터 수집 시작...');

  try {
    // ---------------------------------------------------------
    // 1단계: 인기 게임 리스트 크롤링 (페이지당 50개씩)
    // ---------------------------------------------------------
    let appIds = [];
    let page = 1;

    while (appIds.length < TARGET_COUNT) {
      console.log(`🔍 인기 차트 ${page}페이지 크롤링 중...`);
      
      const url = `https://store.steampowered.com/search/?filter=topsellers&category1=998&l=koreana&page=${page}`;
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);

      $('#search_resultsRows > a').each((i, el) => {
        if (appIds.length >= TARGET_COUNT) return false;
        const appId = $(el).attr('data-ds-appid');
        // 번들 패키지(여러개 묶음)는 건너뛰고 단일 게임만 수집
        if (appId && !appId.includes(',')) {
             appIds.push(parseInt(appId));
        }
      });

      console.log(`   👉 현재까지 확보한 게임 ID: ${appIds.length}개`);
      page++;
      await sleep(1000); 
    }

    appIds = [...new Set(appIds)]; 
    console.log(`✅ 총 ${appIds.length}개의 고유 게임 ID 확보 완료! 상세 정보 조회를 시작합니다.`);

    // ---------------------------------------------------------
    // 2단계: 상세 정보 조회 및 저장
    // ---------------------------------------------------------
    let processedCount = 0;

    for (const appId of appIds) {
      try {
        const detailRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=koreana`);
        const detailData = await detailRes.json();

        if (detailData[appId] && detailData[appId].success) {
          const game = detailData[appId].data;

          if (game.type !== 'game') continue;

          // ⭐ 날짜 추출 및 변환 로직
          const rawDate = game.release_date ? game.release_date.date : null;
          const formattedDate = parseKoreanDate(rawDate);

          const gamePayload = {
            title: game.name,
            description: game.short_description,
            image_url: game.header_image,
            categories: game.genres ? game.genres.map(g => g.description) : [],
            release_date: formattedDate, // ⭐ 여기에 추가됨!
            // created_at은 Supabase가 자동 처리
          };

          // Supabase 저장
          // title 대신 id를 기준으로 upsert 하는 것이 더 안전합니다 (게임명이 바뀔 수도 있으니)
          // 하지만 기존 로직을 유지하려면 title 사용하셔도 됩니다.
          const { error } = await supabase
            .from('games')
            .upsert(gamePayload, { onConflict: 'title' }); 

          if (error) {
            console.error(`❌ [${game.name}] 저장 실패:`, error.message);
          } else {
            console.log(`💾 [${++processedCount}/${appIds.length}] 저장 완료: ${game.name} (${formattedDate || '날짜없음'})`);
          }
        }
      } catch (err) {
        console.error(`⚠️ AppID ${appId} 처리 중 에러:`, err.message);
      }

      await sleep(1500); // 1.5초 대기
    }

    console.log('🎉 모든 작업이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 치명적 오류 발생:', error);
  }
}

main();
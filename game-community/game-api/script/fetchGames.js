// script/fetchGames.js
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const supabase = require('./supabase');

// 1. 설정
const TARGET_COUNT = 200; // 가져올 게임 수
const BATCH_SIZE = 50;    // 한 번에 저장할 개수 (메모리 절약)

// 2. 딜레이 함수 (차단 방지)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
      
      // 스팀 검색 페이지 (한국어, 인기순)
      const url = `https://store.steampowered.com/search/?filter=topsellers&category1=998&l=koreana&page=${page}`;
      const res = await fetch(url);
      const html = await res.text();
      const $ = cheerio.load(html);

      // 게임 ID 추출
      $('#search_resultsRows > a').each((i, el) => {
        if (appIds.length >= TARGET_COUNT) return false;
        const appId = $(el).attr('data-ds-appid');
        if (appId) appIds.push(parseInt(appId));
      });

      console.log(`   👉 현재까지 확보한 게임 ID: ${appIds.length}개`);
      page++;
      await sleep(1000); // 1초 휴식
    }

    // 중복 제거
    appIds = [...new Set(appIds)]; 
    console.log(`✅ 총 ${appIds.length}개의 고유 게임 ID 확보 완료! 상세 정보 조회를 시작합니다.`);

    // ---------------------------------------------------------
    // 2단계: 상세 정보 조회 및 저장
    // ---------------------------------------------------------
    let processedCount = 0;

    for (const appId of appIds) {
      try {
        // 상세 정보 API 호출
        const detailRes = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&l=koreana`);
        const detailData = await detailRes.json();

        if (detailData[appId] && detailData[appId].success) {
          const game = detailData[appId].data;

          // 무료 게임이나 아직 출시 안 된 게임 걸러내기 (선택사항)
          if (game.type !== 'game') continue;

          // DB에 넣을 데이터 정리
          const gamePayload = {
            title: game.name,
            description: game.short_description,
            image_url: game.header_image,
            categories: game.genres ? game.genres.map(g => g.description) : [], // ["RPG", "액션"] 형태로 변환
            // created_at 등은 Supabase가 알아서 처리
          };

          // Supabase 저장 (Upsert: 기존에 있으면 업데이트)
          const { error } = await supabase
            .from('games')
            .upsert(gamePayload, { onConflict: 'title' }); // title이 같으면 덮어쓰기 (또는 id 컬럼 사용 가능)

          if (error) {
            console.error(`❌ [${game.name}] 저장 실패:`, error.message);
          } else {
            console.log(`💾 [${++processedCount}/${appIds.length}] 저장 완료: ${game.name}`);
          }
        }
      } catch (err) {
        console.error(`⚠️ AppID ${appId} 처리 중 에러:`, err.message);
      }

      // 너무 빠르면 차단당하므로 1.5초 대기
      await sleep(1500);
    }

    console.log('🎉 모든 작업이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 치명적 오류 발생:', error);
  }
}

main();
// updateGame.js
import "dotenv/config";
import { fetchSteam } from "./fetchSteam.js";
import { fetchOpenCritic } from "./fetchOpenCritic.js";
import { fetchMetacritic } from "./fetchMetacritic.js";
import { saveGame, saveCritics } from "./saveToSupabase.js";

async function updateGame(appId) {
  const game = await fetchSteam(appId);
  if (!game) {
    console.log("Steam 정보 없음");
    return;
  }

  console.log("Steam:", game.title);

  const ocScore = await fetchOpenCritic(game.title);
  const metaScore = await fetchMetacritic(game.title);

  await saveGame(game);
  await saveCritics(appId, metaScore, ocScore);

  console.log("모든 데이터 저장 완료:", game.title);
}

// 테스트: Dota 2 (appId 570)
updateGame(570);

// saveToSupabase.js
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function saveGame(game) {
  const { data, error } = await supabase
    .from("games")
    .upsert({
      id: game.steam_appid,
      steam_appid: game.steam_appid,
      title: game.title,
      description: game.description,
      header_image: game.header_image,
      genres: game.genres,
      release_date: game.release_date
    });

  if (error) console.error("게임 저장 오류:", error);
  else console.log(`게임 저장 완료: ${game.title}`);

  return data;
}

export async function saveCritics(gameId, metaScore, ocScore) {
  const { data, error } = await supabase
    .from("critics")
    .upsert({
      game_id: gameId,
      metacritic_score: metaScore,
      opencritic_score: ocScore
    });

  if (error) console.error("평론 저장 오류:", error);
  else console.log(`평론 저장 완료: game_id ${gameId}`);

  return data;
}

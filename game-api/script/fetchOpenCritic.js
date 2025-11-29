// fetchOpenCritic.js
import fetch from "node-fetch";

export async function fetchOpenCritic(title) {
  const searchUrl = `https://api.opencritic.com/api/meta/search?criteria=${encodeURIComponent(title)}`;

  const search = await fetch(searchUrl);
  const results = await search.json();

  if (!results.length) return null;

  const gameId = results[0].id;
  const res = await fetch(`https://api.opencritic.com/api/game/${gameId}`);
  const info = await res.json();

  return info.medianScore || null; // 0~100
}

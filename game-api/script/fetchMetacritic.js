// fetchMetacritic.js
import fetch from "node-fetch";

export async function fetchMetacritic(title) {
  const url = `https://metacriticapi.p.rapidapi.com/search/${encodeURIComponent(title)}`;

  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY
    },
  });

  const json = await res.json();
  return json?.result?.score ?? null;
}

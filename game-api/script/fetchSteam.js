// fetchSteam.js
import fetch from "node-fetch";

export async function fetchSteam(appId) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
  const res = await fetch(url);
  const json = await res.json();

  if (!json[appId]?.success) return null;

  const data = json[appId].data;

  return {
    steam_appid: appId,
    title: data.name,
    description: data.short_description,
    header_image: data.header_image,
    genres: data.genres,
    release_date: data.release_date?.date,
  };
}

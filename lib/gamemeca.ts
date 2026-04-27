import * as cheerio from "cheerio";

export type NewsCategory =
  | "main"
  | "industry"
  | "esports"
  | "pc"
  | "mobile"
  | "console";

export type GameMecaListItem = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  articleUrl: string;
  createdAt: string;
  category: NewsCategory;
};

export type GameMecaArticle = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string;
  articleUrl: string;
  createdAt: string;
  bodyHtml: string;
};

const BASE_URL = "https://www.gamemeca.com";

const CATEGORY_URL_MAP: Record<NewsCategory, string> = {
  main: `${BASE_URL}/news.php`,
  industry: `${BASE_URL}/news.php?ca=I`,
  esports: `${BASE_URL}/news.php?ca=T&se=146`,
  pc: `${BASE_URL}/news.php?ca=P`,
  mobile: `${BASE_URL}/news.php?ca=M`,
  console: `${BASE_URL}/news.php?ca=V`,
};

function normalizeUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
}

function slugFromArticleUrl(articleUrl: string) {
  try {
    const u = new URL(articleUrl);
    if (u.searchParams.get("gid")) return u.searchParams.get("gid") as string;
    return encodeURIComponent(articleUrl);
  } catch {
    return encodeURIComponent(articleUrl);
  }
}

function cleanText(value?: string) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function extractImageFromElement(root: cheerio.Cheerio<any>) {
  const img = root.find("img").first();
  if (!img.length) return "";

  const raw =
    img.attr("src") ||
    img.attr("data-src") ||
    img.attr("data-original") ||
    img.attr("data-lazy-src") ||
    img.attr("data-lazy") ||
    "";

  return normalizeUrl(raw);
}

async function fetchArticleOgImage(articleUrl: string) {
  try {
    const res = await fetch(articleUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      cache: "no-store",
    });

    if (!res.ok) return "";

    const html = await res.text();
    const $ = cheerio.load(html);

    return (
      normalizeUrl($("meta[property='og:image']").attr("content")) ||
      normalizeUrl($("meta[name='twitter:image']").attr("content")) ||
      normalizeUrl($(".article img").first().attr("src")) ||
      normalizeUrl($(".view_cont img").first().attr("src")) ||
      ""
    );
  } catch {
    return "";
  }
}

export async function fetchGameMecaList(
  category: NewsCategory
): Promise<GameMecaListItem[]> {
  const targetUrl = CATEGORY_URL_MAP[category];

  const res = await fetch(targetUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`게임메카 목록 요청 실패: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const items: GameMecaListItem[] = [];

  $("a[href*='view.php?gid=']").each((_, el) => {
    const link = $(el);
    const href = link.attr("href");
    if (!href) return;

    const articleUrl = normalizeUrl(href);

    const wrapper = link.closest("li, article, tr, dl, .list_li, .news_li, .cont_li");
    const wrapperText = cleanText(wrapper.text());

    const title =
      cleanText(link.find("strong").first().text()) ||
      cleanText(link.attr("title")) ||
      cleanText(wrapper.find("strong").first().text()) ||
      cleanText(wrapper.find(".tit").first().text()) ||
      cleanText(wrapper.find(".title").first().text()) ||
      cleanText(link.text());

    if (!title || title.length < 5) return;

    const summary =
      cleanText(wrapper.find("p").first().text()) ||
      cleanText(wrapper.find(".txt").first().text()) ||
      cleanText(wrapper.find(".desc").first().text()) ||
      cleanText(wrapper.find(".summary").first().text()) ||
      cleanText(wrapperText.replace(title, ""));

    // 이미지 탐색 범위를 줄여서 같은 썸네일 반복 문제를 막음
    let imageUrl =
      extractImageFromElement(link) ||
      extractImageFromElement(wrapper.find("a").first()) ||
      extractImageFromElement(wrapper);

    const createdAtMatch = wrapperText.match(/\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}/);
    const createdAt = createdAtMatch ? createdAtMatch[0] : "";

    items.push({
      id: slugFromArticleUrl(articleUrl),
      title,
      summary,
      imageUrl,
      articleUrl,
      createdAt,
      category,
    });
  });

  const unique = Array.from(
    new Map(items.map((item) => [item.articleUrl, item])).values()
  );

  const filtered = unique.filter((item) => item.title.length > 3).slice(0, 20);

  // 같은 이미지가 반복되거나 이미지가 비어 있으면 기사 상세의 og:image로 보정
  const imageCount = new Map<string, number>();
  for (const item of filtered) {
    if (!item.imageUrl) continue;
    imageCount.set(item.imageUrl, (imageCount.get(item.imageUrl) || 0) + 1);
  }

  const fixed = await Promise.all(
    filtered.map(async (item) => {
      const duplicated =
        item.imageUrl && (imageCount.get(item.imageUrl) || 0) >= 2;

      if (!item.imageUrl || duplicated) {
        const ogImage = await fetchArticleOgImage(item.articleUrl);
        if (ogImage) {
          return {
            ...item,
            imageUrl: ogImage,
          };
        }
      }

      return item;
    })
  );

  return fixed;
}

export async function fetchGameMecaArticle(
  articleUrl: string
): Promise<GameMecaArticle> {
  const res = await fetch(articleUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`게임메카 기사 요청 실패: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const title =
    $("meta[property='og:title']").attr("content")?.trim() ||
    $("title").text().trim();

  const summary =
    $("meta[property='og:description']").attr("content")?.trim() ||
    $("meta[name='description']").attr("content")?.trim() ||
    "";

  const imageUrl =
    normalizeUrl($("meta[property='og:image']").attr("content")) ||
    normalizeUrl($("meta[name='twitter:image']").attr("content")) ||
    normalizeUrl($(".article img").first().attr("src")) ||
    normalizeUrl($(".view_cont img").first().attr("src")) ||
    normalizeUrl($("img").first().attr("src")) ||
    "";

  const bodyCandidates = [
    ".article",
    ".article-text",
    ".news-text",
    ".view_cont",
    "#content",
    ".content",
  ];

  let bodyHtml = "";

  for (const selector of bodyCandidates) {
    const found = $(selector).first();
    if (found.length) {
      bodyHtml = found.html() || "";
      if (bodyHtml.trim()) break;
    }
  }

  if (!bodyHtml) {
    bodyHtml = $("body")
      .find("p")
      .slice(0, 20)
      .toArray()
      .map((p) => $.html(p))
      .join("");
  }

  const pageText = $("body").text().replace(/\s+/g, " ");
  const createdAtMatch = pageText.match(/\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}/);
  const createdAt = createdAtMatch ? createdAtMatch[0] : "";

  return {
    id: slugFromArticleUrl(articleUrl),
    title,
    summary,
    imageUrl,
    articleUrl,
    createdAt,
    bodyHtml,
  };
}
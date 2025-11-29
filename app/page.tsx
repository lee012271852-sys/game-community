"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

/**
 * GameVerse — 평론 & 커뮤니티 메인 (연보라 / 하늘색 계열)
 *
 * - 블록: 추천 많은 평론 / 최신 평론 / 추천 많은 커뮤니티 / 최신 커뮤니티 / 뉴스
 * - Supabase 테이블: reviews, community_posts, news_posts (필수 컬럼: created_at, like_count, category 등)
 */

/* --------------------------
   간단 UI 컴포넌트 (Tailwind)
   -------------------------- */
function SmallBtn({ children, onClick, className }: any) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-md text-sm font-medium transition " +
        "bg-white/90 hover:bg-white " +
        (className || "")
      }
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ children, onClick, className }: any) {
  return (
    <button
      onClick={onClick}
      className={
        "px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition " +
        "bg-sky-600 hover:bg-sky-700 text-white " +
        (className || "")
      }
    >
      {children}
    </button>
  );
}

function Card({ children, className }: any) {
  return (
    <div
      className={
        "bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden " +
        (className || "")
      }
    >
      {children}
    </div>
  );
}

function CardBody({ children, className }: any) {
  return <div className={"p-4 " + (className || "")}>{children}</div>;
}

/* --------------------------
   타입
   -------------------------- */
type Review = {
  id: number;
  title: string;
  content: string;
  rating?: number;
  like_count?: number;
  author_name?: string;
  created_at?: string;
};

type CommunityPost = {
  id: number;
  title: string;
  excerpt?: string;
  author_name?: string;
  like_count?: number;
  created_at?: string;
};

type NewsPost = {
  id: number;
  title: string;
  category?: string;
  image_url?: string;
  created_at?: string;
};

/* --------------------------
   메인 컴포넌트
   -------------------------- */
export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  const [latestReviews, setLatestReviews] = useState<Review[]>([]);
  const [topReviews, setTopReviews] = useState<Review[]>([]);
  const [latestCommunity, setLatestCommunity] = useState<CommunityPost[]>([]);
  const [topCommunity, setTopCommunity] = useState<CommunityPost[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>("all");

  const NEWS_CATEGORIES = useMemo(
    () => ["all", "industry", "pc", "console", "mobile", "esports", "hot"],
    []
  );

  // 세션
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);
    };
    check();
  }, []);

  // 데이터 로드
  useEffect(() => {
    const load = async () => {
      const latestRev = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (!latestRev.error) setLatestReviews(latestRev.data as Review[]);

      const topRev = await supabase
        .from("reviews")
        .select("*")
        .order("like_count", { ascending: false })
        .limit(6);
      if (!topRev.error) setTopReviews(topRev.data as Review[]);

      const latestCom = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (!latestCom.error) setLatestCommunity(latestCom.data as CommunityPost[]);

      const topCom = await supabase
        .from("community_posts")
        .select("*")
        .order("like_count", { ascending: false })
        .limit(6);
      if (!topCom.error) setTopCommunity(topCom.data as CommunityPost[]);

      const n = await supabase
        .from("news_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!n.error) setNews(n.data as NewsPost[]);
    };

    load();
  }, []);

  const filteredNews = useMemo(() => {
    if (activeNewsCategory === "all") return news;
    return news.filter(
      (n) => (n.category ?? "").toLowerCase() === activeNewsCategory.toLowerCase()
    );
  }, [news, activeNewsCategory]);

  /* --------------------------
     UI 렌더링
     -------------------------- */
  return (
    <div className="min-h-screen bg-[#F4F3FF] text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/")}
              className="text-2xl font-extrabold text-purple-600 hover:text-sky-600"
            >
              GameVerse
            </button>

            <nav className="hidden md:flex gap-4 text-sm text-gray-700">
              <button onClick={() => router.push("/review")} className="px-2 py-1 rounded-md hover:bg-white">
                평론
              </button>
              <button onClick={() => router.push("/community")} className="px-2 py-1 rounded-md hover:bg-white">
                커뮤니티
              </button>
              <button onClick={() => router.push("/recommend")} className="px-2 py-1 rounded-md hover:bg-white">
                AI 추천
              </button>
              <button onClick={() => router.push("/news")} className="px-2 py-1 rounded-md hover:bg-white">
                뉴스
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* 검색 */}
            <div className="hidden sm:flex items-center bg-white border border-gray-200 rounded-md shadow-sm px-2">
              <input
                placeholder="평론 / 게시글 / 게임 검색"
                className="outline-none text-sm px-2 py-1 w-56"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push(`/search?q=${encodeURIComponent(
                      (e.target as HTMLInputElement).value
                    )}`);
                  }
                }}
              />
              <button className="text-sm text-gray-500 px-2">검색</button>
            </div>

            {user ? (
              <>
                <SmallBtn onClick={() => router.push("/mypage")}>내정보</SmallBtn>
                <SmallBtn
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                    router.refresh();
                  }}
                >
                  로그아웃
                </SmallBtn>
              </>
            ) : (
              <>
                <SmallBtn onClick={() => router.push("/auth")}>로그인</SmallBtn>
                <PrimaryBtn onClick={() => router.push("/auth?mode=signup")}>회원가입</PrimaryBtn>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-8 pb-6">
        <div className="rounded-xl p-8 bg-gradient-to-r from-[#F4F3FF] to-white border border-gray-100 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
              게임 평론과 커뮤니티가 만나는 곳
            </h1>

            <p className="mt-3 text-gray-600 max-w-2xl">
              좋아하는 게임을 분석하고 추천받고, 평론을 남기고 토론하세요.
            </p>

            <div className="mt-6 flex gap-3">
              <PrimaryBtn onClick={() => router.push("/review")}>평론 바로보기</PrimaryBtn>

              {/* ➜ 여기! 추천 버튼 추가 */}
              <PrimaryBtn onClick={() => router.push("/recommend")} className="bg-purple-600 hover:bg-purple-700">
                추천 보기
              </PrimaryBtn>

              <button
                onClick={() => router.push("/community")}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-white"
              >
                커뮤니티로 이동
              </button>
            </div>
          </div>

          <div className="w-full md:w-80">
            <Card className="bg-gradient-to-b from-white to-[#F9F8FF] border border-gray-100">
              <CardBody>
                <div className="text-sm text-gray-600">오늘의 추천 평론</div>
                <h3 className="mt-2 text-lg font-semibold text-purple-600">“이번 달의 심층 분석 — RPG A”</h3>
                <p className="mt-2 text-sm text-gray-700 line-clamp-3">
                  플레이 메카닉부터 이야기 구성까지, 깊이 있게 분석한 평론을 확인하세요.
                </p>
                <div className="mt-4 flex gap-2">
                  <SmallBtn onClick={() => router.push("/review/featured")}>자세히 보기</SmallBtn>
                  <SmallBtn onClick={() => router.push("/recommend")}>비슷한 게임 추천</SmallBtn>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* GRID */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
        {/* 평론 영역 */}
        <section className="lg:col-span-7 space-y-6">
          {/* 추천 많은 평론 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-gray-900">⭐ 추천 많은 평론</h2>
              <div className="text-sm text-gray-500">독자 추천 기준 상위</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topReviews.length > 0
                ? topReviews.map((r) => (
                    <Card
                      key={r.id}
                      className="hover:shadow-md cursor-pointer"
                      onClick={() => router.push(`/review/${r.id}`)}
                    >
                      <CardBody>
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            👍 {r.like_count ?? 0} · {r.rating ? `평점 ${r.rating}` : ""}
                          </div>
                          <div className="text-xs text-gray-400">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                          </div>
                        </div>
                        <h3 className="mt-2 font-semibold text-purple-600 text-lg">{r.title}</h3>
                        <p className="mt-2 text-sm text-gray-700 line-clamp-3">{r.content}</p>
                      </CardBody>
                    </Card>
                  ))
                : [1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardBody>
                        <div className="text-sm text-gray-500">추천 많은 평론 자리</div>
                        <div className="mt-2 font-semibold text-gray-900">평론 제목 {i}</div>
                      </CardBody>
                    </Card>
                  ))}
            </div>
          </div>

          {/* 최신 평론 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold text-gray-900">✨ 최신 평론</h2>
              <div className="text-sm text-gray-500">최신 순</div>
            </div>

            <div className="space-y-3">
              {latestReviews.length > 0
                ? latestReviews.map((r) => (
                    <Card
                      key={r.id}
                      className="hover:shadow-md cursor-pointer"
                      onClick={() => router.push(`/review/${r.id}`)}
                    >
                      <CardBody>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{r.title}</h4>
                            <p className="text-sm text-gray-700 mt-1 line-clamp-2">{r.content}</p>
                            <div className="text-xs text-gray-400 mt-2">
                              {r.author_name ?? "익명"} ·{" "}
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}
                            </div>
                          </div>

                          <div className="w-28 text-right">
                            <div className="text-sm font-medium text-purple-600">
                              {r.like_count ?? 0} 추천
                            </div>
                            {r.rating && <div className="text-xs text-gray-400 mt-2">평점 {r.rating}</div>}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))
                : "최근 평론이 없습니다."}
            </div>
          </div>
        </section>

        {/* 오른쪽 영역 (커뮤니티 + 뉴스) */}
        <aside className="lg:col-span-5 space-y-6">
          {/* 추천 많은 커뮤니티 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900">🔥 추천 많은 게시글</h3>
              <div className="text-sm text-gray-500">커뮤니티 인기글</div>
            </div>

            <div className="space-y-3">
              {topCommunity.length > 0
                ? topCommunity.map((p) => (
                    <Card
                      key={p.id}
                      className="hover:shadow-md cursor-pointer"
                      onClick={() => router.push(`/community/${p.id}`)}
                    >
                      <CardBody>
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-gray-900">{p.title}</div>
                          <div className="text-xs text-gray-400">♥ {p.like_count ?? 0}</div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          {p.author_name ?? "익명"} ·{" "}
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}
                        </div>
                      </CardBody>
                    </Card>
                  ))
                : "인기 게시글이 없습니다."}
            </div>
          </div>

          {/* 최신 커뮤니티 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900">📰 최신 커뮤니티 글</h3>
              <div className="text-sm text-gray-500">실시간</div>
            </div>

            <div className="space-y-2 max-h-72 overflow-auto pr-2">
              {latestCommunity.length > 0
                ? latestCommunity.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-start justify-between gap-2 bg-white rounded-md p-3 border border-gray-100 hover:shadow-sm cursor-pointer"
                      onClick={() => router.push(`/community/${p.id}`)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{p.title}</div>
                        <div className="text-xs text-gray-400">
                          {p.author_name ?? "익명"} ·{" "}
                          {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">♥ {p.like_count ?? 0}</div>
                    </div>
                  ))
                : "게시글 없음"}
            </div>
          </div>

          {/* 뉴스 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold text-gray-900">🗞 뉴스</h3>
              <div className="text-sm text-gray-500">카테고리</div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {NEWS_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveNewsCategory(c)}
                  className={`px-2 py-1 rounded-md text-xs border ${
                    activeNewsCategory === c
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  {c === "all" ? "전체" : c.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="space-y-3 max-h-64 overflow-auto pr-2">
              {filteredNews.length > 0
                ? filteredNews.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 border rounded-md bg-white p-3 border-gray-100 hover:shadow-sm cursor-pointer"
                      onClick={() => router.push(`/news/${n.id}`)}
                    >
                      <div className="w-16 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                        {n.image_url ? (
                          <img
                            src={n.image_url}
                            alt={n.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                            No Img
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{n.title}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {n.category ?? "일반"} ·{" "}
                          {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                        </div>
                      </div>
                    </div>
                  ))
                : "뉴스 없음"}
            </div>
          </div>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="font-semibold text-gray-900 mb-2">GameVerse</div>
            <div>전문가 수준의 평론과 활발한 커뮤니티 플랫폼.</div>
          </div>

          <div>
            <div className="font-semibold text-gray-900 mb-2">서비스</div>
            <div className="flex flex-col gap-1">
              <a className="hover:text-purple-600 cursor-pointer" onClick={() => router.push("/review")}>
                평론
              </a>
              <a className="hover:text-purple-600 cursor-pointer" onClick={() => router.push("/community")}>
                커뮤니티
              </a>
              <a className="hover:text-purple-600 cursor-pointer" onClick={() => router.push("/recommend")}>
                추천
              </a>
              <a className="hover:text-purple-600 cursor-pointer" onClick={() => router.push("/news")}>
                뉴스
              </a>
            </div>
          </div>

          <div>
            <div className="font-semibold text-gray-900 mb-2">문의</div>
            <div>team@example.com</div>
            <div className="text-xs text-gray-400 mt-2">© 2025 GameVerse · 모든 권리 보유</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

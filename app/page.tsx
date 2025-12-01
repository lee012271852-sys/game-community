"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

/* --------------------------
   기본 UI 컴포넌트
--------------------------- */
function SmallBtn({ children, onClick, className }: any) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-md text-sm font-medium transition bg-white/90 hover:bg-white " +
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
        "px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition bg-sky-600 hover:bg-sky-700 text-white " +
        (className || "")
      }
    >
      {children}
    </button>
  );
}

function Card({ children, className, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={
        "bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden " +
        (onClick ? "cursor-pointer hover:shadow-md " : "") +
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
--------------------------- */
type Review = {
  id: number;
  title: string;
  content: string;
  rating?: number;
  like_count?: number;
  author_name?: string;
  created_at?: string;
  source?: string; // 내부/외부 구분용
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
--------------------------- */
export default function HomePage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  const [latestReviews, setLatestReviews] = useState<Review[]>([]);
  const [topReviews, setTopReviews] = useState<Review[]>([]);
  const [latestCommunity, setLatestCommunity] = useState<CommunityPost[]>([]);
  const [topCommunity, setTopCommunity] = useState<CommunityPost[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>("all");

  const NEWS_CATEGORIES = ["all", "industry", "pc", "console", "mobile", "esports", "hot"];

  /* 로그인 상태 확인 */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
    });
  }, []);

  /* 데이터 로드 */
  useEffect(() => {
    const load = async () => {
      // 🔵 외부 API 리뷰 제외: source="user" 만 표시
      const latestRev = await supabase
        .from("reviews")
        .select("*")
        .eq("source", "user")
        .order("created_at", { ascending: false })
        .limit(8);
      if (!latestRev.error) setLatestReviews(latestRev.data as Review[]);

      const topRev = await supabase
        .from("reviews")
        .select("*")
        .eq("source", "user")
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
--------------------------- */
  return (
    <div className="min-h-screen bg-[#F4F3FF] text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/")}
              className="text-2xl font-extrabold text-sky-600 hover:text-sky-700"
            >
              GameVerse
            </button>

            <nav className="hidden md:flex gap-4 text-sm text-gray-700">
              <button onClick={() => router.push("/review")} className="px-2 py-1 hover:bg-white">
                평론
              </button>
              <button
                onClick={() => router.push("/community")}
                className="px-2 py-1 hover:bg-white"
              >
                커뮤니티
              </button>
              <button
                onClick={() => router.push("/recommend")}
                className="px-2 py-1 hover:bg-white"
              >
                AI 추천
              </button>
              <button onClick={() => router.push("/news")} className="px-2 py-1 hover:bg-white">
                뉴스
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
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
                <PrimaryBtn onClick={() => router.push("/auth?mode=signup")}>
                  회원가입
                </PrimaryBtn>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO (뉴스 준비중) */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-8">
        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm p-10 flex flex-col items-center justify-center">
          <div className="text-4xl font-extrabold text-gray-800 mb-4">
            📰 뉴스 영역 준비 중
          </div>
          <p className="text-gray-600 text-center text-lg">
            현재 뉴스 모듈을 개발하고 있습니다.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
        {/* 평론 영역 */}
        <section className="lg:col-span-7 space-y-6">
          {/* 추천 많은 평론 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">⭐ 추천 많은 평론</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topReviews.length > 0
                ? topReviews.map((r) => (
                    <Card key={r.id} onClick={() => router.push(`/review/${r.id}`)}>
                      <CardBody>
                        <div className="text-sm text-gray-500">👍 {r.like_count ?? 0}</div>
                        <h3 className="mt-2 font-semibold text-sky-600 text-lg">{r.title}</h3>
                      </CardBody>
                    </Card>
                  ))
                : "평론 없음"}
            </div>
          </div>

          {/* 최신 평론 */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">✨ 최신 평론</h2>

            <div className="space-y-3">
              {latestReviews.length > 0
                ? latestReviews.map((r) => (
                    <Card key={r.id} onClick={() => router.push(`/review/${r.id}`)}>
                      <CardBody>
                        <h4 className="font-semibold">{r.title}</h4>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">{r.content}</p>
                      </CardBody>
                    </Card>
                  ))
                : "최근 평론 없음"}
            </div>
          </div>
        </section>

        {/* 우측: 커뮤니티 & 뉴스 */}
        <aside className="lg:col-span-5 space-y-6">
          {/* 추천 많은 커뮤니티 */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">🔥 추천 많은 게시글</h3>
            <div className="space-y-3">
              {topCommunity.length > 0
                ? topCommunity.map((p) => (
                    <Card key={p.id} onClick={() => router.push(`/community/${p.id}`)}>
                      <CardBody>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-gray-500 mt-1">♥ {p.like_count ?? 0}</div>
                      </CardBody>
                    </Card>
                  ))
                : "인기 게시글 없음"}
            </div>
          </div>

          {/* 최신 커뮤니티 */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">📝 최신 커뮤니티 글</h3>
            <div className="space-y-2 max-h-72 overflow-auto pr-2">
              {latestCommunity.length > 0
                ? latestCommunity.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/community/${p.id}`)}
                      className="flex items-start justify-between gap-2 bg-white rounded-md p-3 border hover:shadow-sm cursor-pointer"
                    >
                      <div className="font-medium text-gray-900">{p.title}</div>
                      <div className="text-sm text-gray-500">♥ {p.like_count ?? 0}</div>
                    </div>
                  ))
                : "게시글 없음"}
            </div>
          </div>

          {/* 뉴스 */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">🗞 뉴스</h3>

            <div className="flex flex-wrap gap-2 mb-3">
              {NEWS_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveNewsCategory(c)}
                  className={`px-2 py-1 text-xs rounded-md border ${
                    activeNewsCategory === c
                      ? "bg-sky-600 text-white"
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
                      onClick={() => router.push(`/news/${n.id}`)}
                      className="bg-white border rounded-md p-3 hover:shadow cursor-pointer"
                    >
                      <div className="font-medium text-gray-900 text-sm">{n.title}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {n.created_at
                          ? new Date(n.created_at).toLocaleDateString()
                          : ""}
                      </div>
                    </div>
                  ))
                : "뉴스 없음"}
            </div>
          </div>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 text-sm text-gray-600">
          © 2025 GameVerse
        </div>
      </footer>
    </div>
  );
}

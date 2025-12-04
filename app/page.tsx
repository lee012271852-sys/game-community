"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

/* BUTTONS / CARD COMPONENTS */
function SmallBtn({ children, onClick, className }: any) {
  return (
    <button
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-md text-sm font-medium transition bg-white/90 hover:bg-white text-gray-700 border border-gray-200 " +
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
        "px-4 py-2 rounded-md text-sm font-semibold shadow-sm transition bg-indigo-600 hover:bg-indigo-700 text-white " +
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
        "bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden " +
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

type Review = {
  id: number;
  title: string;
  content: string;
  rating?: number;
  likes?: number;
  author_name?: string;
  created_at?: string;
  source?: string;
};

type Community = {
  id: number;
  title: string;
  likes?: number;
  author_name?: string;
  created_at?: string;
};

type NewsPost = {
  id: number;
  title: string;
  category?: string;
  image_url?: string;
  created_at?: string;
};

/* MAIN PAGE */
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [latestReviews, setLatestReviews] = useState<Review[]>([]);
  const [topReviews, setTopReviews] = useState<Review[]>([]);
  const [latestCommunity, setLatestCommunity] = useState<Community[]>([]);
  const [topCommunity, setTopCommunity] = useState<Community[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>("all");

  const NEWS_CATEGORIES = ["all", "industry", "pc", "console", "mobile", "esports", "hot"];

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    const load = async () => {
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
        .order("likes", { ascending: false })
        .limit(6);
      if (!topRev.error) setTopReviews(topRev.data as Review[]);

      const latestCom = await supabase
        .from("community")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      if (!latestCom.error) setLatestCommunity(latestCom.data as Community[]);

      const topCom = await supabase
        .from("community")
        .select("*")
        .order("likes", { ascending: false })
        .limit(6);
      if (!topCom.error) setTopCommunity(topCom.data as Community[]);

      const n = await supabase.from("news_posts").select("*").order("created_at", { ascending: false });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* LEFT → LOGO */}
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-extrabold text-indigo-600 hover:text-indigo-700"
          >
            GameVerse
          </button>

          {/* CENTER → NAV MENU */}
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 text-sm font-medium">
            <button onClick={() => router.push("/community")} className="text-gray-700 hover:text-indigo-600">
              커뮤니티
            </button>
            <button onClick={() => router.push("/review")} className="text-gray-700 hover:text-indigo-600">
              평론
            </button>
            <button onClick={() => router.push("/recommend")} className="text-gray-700 hover:text-indigo-600">
              AI 추천
            </button>
            <button onClick={() => router.push("/news")} className="text-gray-700 hover:text-indigo-600">
              뉴스
            </button>
          </nav>

          {/* RIGHT → AUTH BUTTONS */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.refresh();
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/auth")}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  로그인
                </button>
                <button
                  onClick={() => router.push("/auth?mode=signup")}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-8">
        <div className="bg-white border border-indigo-100 rounded-xl shadow-sm p-10 flex flex-col items-center justify-center">
          <div className="text-4xl font-extrabold text-gray-800 mb-4">📰 뉴스 영역 준비 중</div>
          <p className="text-gray-600 text-center text-lg">
            현재 뉴스 페이지를 개발하고 있습니다.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pb-16">
        {/* 리뷰 */}
        <section className="lg:col-span-7 space-y-6">
          {/* TOP REVIEWS */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">⭐ 추천 많은 평론</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topReviews.length > 0
                ? topReviews.map((r) => (
                    <Card key={r.id} onClick={() => router.push(`/review/${r.id}`)}>
                      <CardBody>
                        <div className="text-sm text-gray-500">👍 {r.likes ?? 0}</div>
                        <h3 className="mt-2 font-semibold text-indigo-600 text-lg">{r.title}</h3>
                      </CardBody>
                    </Card>
                  ))
                : "개발중"}
            </div>
          </div>

          {/* LATEST REVIEWS */}
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
                : "개발중"}
            </div>
          </div>
        </section>

        {/* RIGHT SIDE */}
        <aside className="lg:col-span-5 space-y-6">
          {/* TOP COMMUNITY */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">🔥 추천 많은 게시글</h3>
            <div className="space-y-3">
              {topCommunity.length > 0
                ? topCommunity.map((p) => (
                    <Card key={p.id} onClick={() => router.push(`/community/${p.id}`)}>
                      <CardBody>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-gray-500 mt-1">♥ {p.likes ?? 0}</div>
                      </CardBody>
                    </Card>
                  ))
                : "인기 게시글 없음"}
            </div>
          </div>

          {/* LATEST COMMUNITY */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">📝 최신 커뮤니티 글</h3>
            <div className="space-y-2 max-h-72 overflow-auto pr-2">
              {latestCommunity.length > 0
                ? latestCommunity.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/community/${p.id}`)}
                      className="flex items-start justify-between gap-2 bg-white rounded-md p-3 border hover:bg-indigo-50 cursor-pointer"
                    >
                      <div className="font-medium text-gray-900">{p.title}</div>
                      <div className="text-sm text-gray-500">♥ {p.likes ?? 0}</div>
                    </div>
                  ))
                : "게시글 없음"}
            </div>
          </div>

          {/* NEWS */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">🗞 뉴스</h3>

            <div className="flex flex-wrap gap-2 mb-3">
              {NEWS_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveNewsCategory(c)}
                  className={`px-2 py-1 text-xs rounded-md border ${
                    activeNewsCategory === c
                      ? "bg-indigo-600 text-white"
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
                      className="bg-white border rounded-md p-3 hover:bg-indigo-50 cursor-pointer"
                    >
                      <div className="font-medium text-gray-900 text-sm">{n.title}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                      </div>
                    </div>
                  ))
                : "뉴스 없음"}
            </div>
          </div>
        </aside>
      </div>

      {/* FOOTER */}
      <footer className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 text-sm text-gray-600">
          © 2025 GameVerse
        </div>
      </footer>
    </div>
  );
}


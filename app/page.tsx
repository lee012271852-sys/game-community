"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

/* --------------------------
   간단한 UI 컴포넌트 (Tailwind 전용)
   - 필요하면 나중에 shadcn 버튼/카드로 쉽게 교체 가능
   -------------------------- */
function IconButton({ children, onClick, className }: any) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition " +
        "bg-white/5 hover:bg-white/10 " +
        (className || "")
      }
    >
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, className }: any) {
  return (
    <button
      onClick={onClick}
      className={
        "px-4 py-2 rounded-md text-sm font-semibold shadow-sm transition " +
        "bg-orange-600 hover:bg-orange-700 text-white " +
        (className || "")
      }
    >
      {children}
    </button>
  );
}

function Card({ children, className }: any) {
  return (
    <div className={"bg-white rounded-lg border border-gray-200 " + (className || "")}>
      {children}
    </div>
  );
}

/* --------------------------
   타입 (단순화)
   실제 DB 스키마에 따라 확장하세요.
   news_posts 테이블에 category 컬럼이 있어야 함.
   -------------------------- */
type Post = {
  id: number;
  title: string;
  content: string;
  category?: string;
  image_url?: string;
  created_at?: string;
};

type Release = {
  id: number;
  title: string;
  cover_url?: string;
  release_date?: string;
  platform?: string;
};

/* --------------------------
   메인 컴포넌트
   -------------------------- */
export default function HomePage() {
  const router = useRouter();

  // 유저 세션 (로그인 상태)
  const [user, setUser] = useState<any>(null);

  // 뉴스 / 필터 / 검색
  const [news, setNews] = useState<Post[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [q, setQ] = useState<string>("");

  // 출시작 샘플
  const [releases, setReleases] = useState<Release[]>([]);

  // 가능한 카테고리 — 필요하면 DB에서 동적으로 가져오도록 변경 가능
  const CATEGORIES = useMemo(
    () => [
      { key: "all", label: "전체" },
      { key: "popular", label: "인기" },
      { key: "industry", label: "업계 동향" },
      { key: "pc", label: "PC" },
      { key: "console", label: "콘솔" },
      { key: "mobile", label: "모바일" },
      { key: "esports", label: "e스포츠" },
    ],
    []
  );

  useEffect(() => {
    // 유저 세션 확인
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    check();
  }, []);

  useEffect(() => {
    // 뉴스 로드 (category 컬럼이 있는 news_posts 테이블 가정)
    const fetchNews = async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        console.error("news load error:", error);
        setNews([]);
      } else {
        setNews((data ?? []) as Post[]);
      }
    };
    fetchNews();

    // 샘플 출시작
    setReleases([
      { id: 1, title: "신작 RPG A", cover_url: "/images/release1.jpg", release_date: "2025-11-10", platform: "PC" },
      { id: 2, title: "FPS B", cover_url: "/images/release2.jpg", release_date: "2025-11-15", platform: "Console" },
      { id: 3, title: "모바일 RPG C", cover_url: "/images/release3.jpg", release_date: "2025-11-20", platform: "Mobile" },
    ]);
  }, []);

  // 카테고리 + 검색 적용된 뉴스 리스트
  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return news.filter((p) => {
      if (activeCategory !== "all") {
        if ((p.category ?? "").toLowerCase() !== activeCategory) return false;
      }
      if (!qLower) return true;
      return (
        (p.title ?? "").toLowerCase().includes(qLower) ||
        (p.content ?? "").toLowerCase().includes(qLower)
      );
    });
  }, [news, activeCategory, q]);

  /* --------------------------
     UI 반환
     -------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className="text-2xl font-extrabold text-orange-600" onClick={() => router.push("/")}>
              GameVerse
            </button>

            {/* 검색바 (간단) */}
            <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-md shadow-sm">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="뉴스/키워드 검색 (예: 업데이트, 리뷰, 할인)"
                className="px-3 py-2 w-72 outline-none text-sm"
              />
              <button className="px-3 border-l border-gray-200 text-sm text-gray-600" onClick={() => {}}>
                검색
              </button>
            </div>
          </div>

          <nav className="flex items-center gap-4">
            <div className="hidden sm:flex gap-4">
              <button className="text-sm text-gray-700 hover:text-orange-600" onClick={() => router.push("/community")}>커뮤니티</button>
              <button className="text-sm text-gray-700 hover:text-orange-600" onClick={() => router.push("/review")}>평론</button>
              <button className="text-sm text-gray-700 hover:text-orange-600" onClick={() => router.push("/recommend")}>추천</button>
            </div>

            {/* 로그인 상태 표시 */}
            {user ? (
              <>
                <IconButton onClick={() => router.push("/mypage")}>내정보</IconButton>
                <IconButton
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setUser(null);
                    router.refresh();
                  }}
                >
                  로그아웃
                </IconButton>
              </>
            ) : (
              <>
                <IconButton onClick={() => router.push("/auth")}>로그인</IconButton>
                <PrimaryButton onClick={() => router.push("/auth?mode=signup")}>회원가입</PrimaryButton>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero / Category Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="rounded-lg bg-gradient-to-r from-orange-50 to-white p-6 flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">게임 뉴스 & 커뮤니티 허브</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">업데이트, 신작, e스ports, 업계 동향 등 게임 관련 모든 정보를 한 곳에서.</p>
          </div>
          <div className="flex gap-3 items-center">
            <PrimaryButton onClick={() => router.push("/recommend")}>AI 추천 받기</PrimaryButton>
            <button className="text-sm text-gray-600">· 최근 트렌드 보기</button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={
                "whitespace-nowrap px-3 py-1.5 rounded-md text-sm font-medium border " +
                (activeCategory === c.key
                  ? "bg-orange-600 text-white border-orange-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50")
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left = 뉴스 / Right = 사이드바 */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8 pb-12">
        {/* 뉴스 리스트 (메인) */}
        <section className="lg:col-span-3 space-y-6">
          {/* 필터 요약 */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filtered.length}</span>개의 기사 ·
              <span className="ml-2">카테고리: <span className="font-semibold">{CATEGORIES.find(x=>x.key===activeCategory)?.label}</span></span>
            </div>
            <div className="text-sm text-gray-500">최신 순 정렬</div>
          </div>

          {/* 뉴스 카드 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filtered.slice(0, 12).map((p) => (
              <article key={p.id} className="group">
                <Card className="overflow-hidden hover:shadow-lg transition cursor-pointer" >
                  <div className="flex flex-col sm:flex-row">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full sm:w-40 h-32 object-cover sm:object-center"/>
                    ) : (
                      <div className="w-full sm:w-40 h-32 bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="p-4 flex-1">
                      <h3
                        onClick={() => router.push(`/news/${p.id}`)}
                        className="text-lg font-semibold text-gray-900 group-hover:text-orange-600"
                      >
                        {p.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{p.content}</p>
                      <div className="mt-3 text-xs text-gray-400">{p.created_at ? new Date(p.created_at).toLocaleString() : ""}</div>
                    </div>
                  </div>
                </Card>
              </article>
            ))}
          </div>

          {/* 페이징 / 더보기 버튼 */}
          <div className="flex justify-center">
            <button
              onClick={() => alert("페이지네이션/무한스크롤을 추가하세요")}
              className="px-4 py-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
            >
              더 많은 기사 보기
            </button>
          </div>
        </section>

        {/* 사이드바 */}
        <aside className="space-y-6">
          {/* 로그인 카드 */}
          <Card className="p-4">
            {user ? (
              <div>
                <div className="text-sm text-gray-600">안녕하세요,</div>
                <div className="mt-2 font-semibold text-gray-900">{user.email ?? user.user_metadata?.full_name ?? "회원"}</div>
                <div className="mt-4 flex gap-2">
                  <IconButton onClick={() => router.push("/mypage")}>마이페이지</IconButton>
                  <IconButton onClick={async () => { await supabase.auth.signOut(); setUser(null); router.refresh(); }}>로그아웃</IconButton>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">커뮤니티에 참여하려면 로그인하세요</div>
                <div className="flex gap-2">
                  <IconButton onClick={() => router.push("/auth")}>로그인</IconButton>
                  <PrimaryButton onClick={() => router.push("/auth?mode=signup")}>회원가입</PrimaryButton>
                </div>
              </div>
            )}
          </Card>

          {/* 신작 / 추천 */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">이번 달 신작</h4>
            <div className="space-y-3">
              {releases.map((r) => (
                <div key={r.id} className="flex items-center gap-3">
                  <img src={r.cover_url} alt={r.title} className="w-12 h-12 rounded-md object-cover"/>
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-gray-900">{r.title}</div>
                    <div className="text-xs text-gray-500">{r.platform} · {r.release_date}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 인기 커뮤니티 (간단) */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">인기 커뮤니티</h4>
            <ul className="space-y-2 text-sm">
              <li><a className="text-gray-700 hover:text-orange-600 cursor-pointer" onClick={() => router.push("/community/메이플")}>메이플스토리 게시판</a></li>
              <li><a className="text-gray-700 hover:text-orange-600 cursor-pointer" onClick={() => router.push("/community/디아블로4")}>디아블로4 토론</a></li>
              <li><a className="text-gray-700 hover:text-orange-600 cursor-pointer" onClick={() => router.push("/community/인디")}>인디게임</a></li>
            </ul>
          </Card>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          © 2025 GameVerse · 문의: team@example.com · 이용약관 · 개인정보처리방침
        </div>
      </footer>
    </div>
  );
}

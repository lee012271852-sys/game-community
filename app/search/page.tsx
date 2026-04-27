"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

const Icons = {
  Gamepad: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>,
  FileText: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
};

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") || "";
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"all" | "games" | "posts">("all");
  const [gameResults, setGameResults] = useState<any[]>([]);
  const [postResults, setPostResults] = useState<any[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [totalPosts, setTotalPosts] = useState(0);
  const [loading, setLoading] = useState(true);

  // 페이징 상태
  const [postPage, setPostPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // 검색어가 바뀌면 페이지와 탭 초기화
  useEffect(() => {
    setPostPage(1);
    setActiveTab("all");
  }, [q]);

  useEffect(() => {
    if (!q) return;

    const fetchResults = async () => {
      setLoading(true);

      // 1. 게임 검색 (갯수 파악을 위해 탭에 상관없이 검색)
      const { data: games, count: gCount } = await supabase
        .from("games")
        .select("*", { count: "exact" })
        .ilike("title", `%${q}%`)
        .limit(activeTab === "all" ? 5 : 20); // 전체 탭이면 5개만

      // 2. 게시글 검색 (페이징 적용)
      let postQuery = supabase
        .from("community")
        .select("*", { count: "exact" })
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .order("id", { ascending: false });

      if (activeTab === "all") {
        postQuery = postQuery.limit(5);
      } else if (activeTab === "posts") {
        const from = (postPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        postQuery = postQuery.range(from, to);
      }

      const { data: posts, count: pCount } = await postQuery;

      setGameResults(games || []);
      setPostResults(posts || []);
      if (gCount !== null) setTotalGames(gCount);
      if (pCount !== null) setTotalPosts(pCount);
      setLoading(false);
    };

    fetchResults();
  }, [q, activeTab, postPage]);

  // 페이지네이션 번호 생성 함수
  const renderPagination = (total: number, current: number, setPage: (p: number) => void) => {
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mt-10">
        <button 
          onClick={() => setPage(Math.max(1, current - 1))}
          disabled={current === 1}
          className="p-2 border rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Icons.ChevronLeft />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
          <button
            key={num}
            onClick={() => setPage(num)}
            className={`w-9 h-9 rounded-lg font-bold transition-all ${current === num ? "bg-indigo-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            {num}
          </button>
        ))}
        <button 
          onClick={() => setPage(Math.min(totalPages, current + 1))}
          disabled={current === totalPages}
          className="p-2 border rounded-lg disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Icons.ChevronRight />
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-black italic">SEARCH RESULTS</h1>
        <p className="text-slate-500 mt-1">"<span className="text-indigo-600 font-bold">{q}</span>"에 대한 검색 결과입니다.</p>
      </div>

      {/* 탭 메뉴 */}
      <div className="flex gap-4 border-b dark:border-slate-800 mb-8">
        {[
          { id: "all", label: "전체", count: totalGames + totalPosts },
          { id: "games", label: "게임", count: totalGames },
          { id: "posts", label: "커뮤니티", count: totalPosts },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-4 px-2 text-sm font-black transition-all relative ${activeTab === tab.id ? "text-indigo-600" : "text-slate-400"}`}
          >
            {tab.label} <span className="text-[10px] ml-1 opacity-60">{tab.count}</span>
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full"></div>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse font-bold text-slate-400">데이터를 불러오는 중...</div>
      ) : (
        <div className="space-y-12">
          {/* 게임 결과 */}
          {(activeTab === "all" || activeTab === "games") && gameResults.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="font-black flex items-center gap-2 text-lg"><Icons.Gamepad /> 게임 정보</h2>
                {activeTab === "all" && totalGames > 5 && (
                  <button onClick={() => setActiveTab("games")} className="text-xs font-bold text-indigo-600 hover:underline">더보기 ({totalGames})</button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {gameResults.map(game => (
                  <div key={game.id} onClick={() => router.push(`/review/${game.id}`)} className="cursor-pointer group">
                    <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden mb-2">
                      {game.image_url && <img src={game.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt=""/>}
                    </div>
                    <div className="font-bold text-sm truncate">{game.title}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 커뮤니티 결과 */}
          {(activeTab === "all" || activeTab === "posts") && postResults.length > 0 && (
            <section>
              <div className="flex justify-between items-end mb-4">
                <h2 className="font-black flex items-center gap-2 text-lg"><Icons.FileText /> 커뮤니티</h2>
                {activeTab === "all" && totalPosts > 5 && (
                  <button onClick={() => setActiveTab("posts")} className="text-xs font-bold text-indigo-600 hover:underline">더보기 ({totalPosts})</button>
                )}
              </div>
              <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <ul className="divide-y dark:divide-slate-800">
                  {postResults.map(post => (
                    <li key={post.id} onClick={() => router.push(`/community/${post.id}`)} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                      <div className="text-xs text-indigo-500 font-bold mb-1">[{post.category}]</div>
                      <div className="font-bold mb-1 group-hover:text-indigo-600">{post.title}</div>
                      <div className="text-xs text-slate-400">{post.author} · {new Date(post.created_at).toLocaleDateString()}</div>
                    </li>
                  ))}
                </ul>
              </div>
              {/* 페이지네이션 버튼 (커뮤니티 탭일 때만 노출) */}
              {activeTab === "posts" && renderPagination(totalPosts, postPage, setPostPage)}
            </section>
          )}

          {totalGames === 0 && totalPosts === 0 && (
            <div className="py-20 text-center text-slate-400 font-bold">검색 결과가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
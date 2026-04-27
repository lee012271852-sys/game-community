"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

/** ⭐ 아이콘 및 로더 컴포넌트 */
const Icons = {
  Fire: () => <svg className="w-5 h-5 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.734-.636 4.965 4.965 0 00-.73 2.193 4.996 4.996 0 005.152 5.567 5.002 5.002 0 004.97-5.32 8.783 8.783 0 00-.916-4.522 9.426 9.426 0 00-1.127-1.928c-.167-.23-.335-.43-.497-.587zM8 12a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>,
  Heart: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  Star: () => <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Image: () => <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Gamepad: () => <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>,
  Loader: ({ className }: { className?: string }) => <svg className={`w-6 h-6 animate-spin text-muted-foreground ${className || ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
};

/** ⭐ 타입 정의 */
type Review = { id: number; game_id?: number; title: string; content: string; rating?: number; likes?: number; author_name?: string; created_at?: string; games?: { title: string }; };
type Community = { id: number; title: string; likes?: number; author_name?: string; created_at?: string; comment_count?: number; };
type TopGame = { id: number; title: string; image_url?: string; metacritic_score?: number; opencritic_score?: number; };

const NEWS_CATEGORIES = [
  { id: "main", label: "전체" },
  { id: "industry", label: "산업" },
  { id: "esports", label: "eSports" },
  { id: "pc", label: "PC" },
  { id: "mobile", label: "모바일" },
  { id: "console", label: "콘솔" },
];

/** ⭐ 유틸리티 함수: 날짜 포맷 (Hydration Error 방지) */
const formatDate = (dateString?: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getFullYear().toString().slice(-2)}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [topGames, setTopGames] = useState<TopGame[]>([]);
  const [latestReviews, setLatestReviews] = useState<Review[]>([]);
  const [topReviews, setTopReviews] = useState<Review[]>([]);
  const [latestCommunity, setLatestCommunity] = useState<Community[]>([]);
  const [topCommunity, setTopCommunity] = useState<Community[]>([]);
  
  const [isMainLoading, setIsMainLoading] = useState<boolean>(true);
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState<boolean>(true);
  const [activeNewsCategory, setActiveNewsCategory] = useState<string>("main");

  /** 인증 상태 관리 */
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === "SIGNED_OUT") router.refresh();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  /** 뉴스 데이터 로딩 */
  const fetchNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await fetch(`/api/gamemeca/list?category=${activeNewsCategory}`);
      if (!res.ok) throw new Error("네트워크 응답 에러");
      const data = await res.json();
      setNews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("뉴스 로딩 실패:", error);
      setNews([]);
    } finally {
      setNewsLoading(false);
    }
  }, [activeNewsCategory]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  /** 메인 데이터 로딩 */
  useEffect(() => {
    const loadMainData = async () => {
      setIsMainLoading(true);
      try {
        // 1. 인기 게임 로드
        const gamesRes = await supabase.from("games")
          .select("id, title, image_url, metacritic_score, opencritic_score")
          .not("image_url", "is", null)
          .limit(20);
        
        if (gamesRes.data) {
          const sorted = gamesRes.data
            .sort((a, b) => {
              const sA = Math.max(a.metacritic_score || 0, a.opencritic_score || 0);
              const sB = Math.max(b.metacritic_score || 0, b.opencritic_score || 0);
              return sB - sA;
            })
            .slice(0, 4);
          setTopGames(sorted);
        }

        // 2. 최신 평론 로드
        const latestRev = await supabase.from("reviews")
          .select("*, games(title)")
          .order("created_at", { ascending: false })
          .limit(8);
        if (latestRev.data) setLatestReviews(latestRev.data as Review[]);

        // 3. 인기 평론 로드 (최근 7일)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const topRev = await supabase.from("reviews")
          .select("*, games(title)")
          .gte("created_at", oneWeekAgo.toISOString())
          .order("likes", { ascending: false })
          .limit(4);
        if (topRev.data) setTopReviews(topRev.data as Review[]);

        // 4. 최신 커뮤니티 로드
        const latestCom = await supabase.from("community")
          .select("*, comments(count)")
          .order("created_at", { ascending: false })
          .limit(8);
        if (latestCom.data) {
          setLatestCommunity(latestCom.data.map((item: any) => ({
            ...item,
            comment_count: item.comments?.[0]?.count || 0
          })) as Community[]);
        }

        // 5. ⭐ 인기 커뮤니티 로드 (최근 24시간 -> 7일로 변경)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const topCom = await supabase.from("community")
          .select("*, comments(count)")
          .gte("created_at", sevenDaysAgo.toISOString())
          .order("likes", { ascending: false })
          .limit(5);
        if (topCom.data) {
          setTopCommunity(topCom.data.map((item: any) => ({
            ...item,
            comment_count: item.comments?.[0]?.count || 0
          })) as Community[]);
        }

      } catch (err) {
        console.error("데이터 로딩 중 에러:", err);
      } finally {
        setIsMainLoading(false);
      }
    };
    loadMainData();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        
        
        {/* 섹션: 이번 주 인기 게임 */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icons.Gamepad />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">이번 주 인기 게임</h2>
          </div>
          
          <div className="flex overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-4 sm:pb-0 snap-x snap-mandatory scrollbar-hide">
            {isMainLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[75vw] sm:w-auto h-44 sm:h-48 lg:h-52 rounded-2xl bg-muted animate-pulse border border-border" />
              ))
            ) : topGames.length > 0 ? (
              topGames.map((game) => {
                const score = Math.max(game.opencritic_score || 0, game.metacritic_score || 0);
                return (
                  <div 
                    key={game.id} 
                    onClick={() => router.push(`/review/${game.id}`)} 
                    className="flex-shrink-0 w-[75vw] sm:w-auto snap-center group relative h-44 sm:h-48 lg:h-52 rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-border bg-card"
                  >
                    {game.image_url ? (
                      <img src={game.image_url} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground"><Icons.Image /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    {score > 0 && (
                      <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-black shadow-lg backdrop-blur-md bg-opacity-90 border transition-transform group-hover:scale-105 ${score >= 80 ? 'bg-emerald-500/90 text-white border-emerald-400' : score >= 50 ? 'bg-amber-500/90 text-white border-amber-400' : 'bg-rose-500/90 text-white border-rose-400'}`}>
                        {score}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 p-4 w-full">
                      <h3 className="text-white font-extrabold text-base sm:text-lg line-clamp-2 drop-shadow-md">{game.title}</h3>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl">인기 게임 데이터가 없습니다.</div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* 왼쪽 컬럼 (뉴스, 평론) */}
          <div className="lg:col-span-8 flex flex-col gap-6 w-full">
            
            {/* 최신 게임 뉴스 */}
            <section className="w-full bg-card rounded-2xl border border-border p-6 shadow-sm order-1 lg:order-2">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
                <button onClick={() => router.push("/news")} className="font-bold text-sm hover:text-primary transition-colors flex items-center gap-1">최신 게임 뉴스 <Icons.ChevronRight /></button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-5">
                {NEWS_CATEGORIES.map((c) => (
                  <button 
                    key={c.id} 
                    onClick={() => setActiveNewsCategory(c.id)} 
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeNewsCategory === c.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4">
                {newsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Icons.Loader className="mb-3 w-8 h-8" /></div>
                ) : news.length > 0 ? (
                  news.slice(0, 4).map((n) => (
                    <div key={n.id} onClick={() => router.push(`/news/detail?url=${encodeURIComponent(n.articleUrl)}`)} className="flex gap-4 p-3 hover:bg-accent/50 transition-colors rounded-xl cursor-pointer group border border-transparent hover:border-border">
                      <div className="flex-shrink-0 w-28 h-20 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-muted border border-border">
                        {n.imageUrl ? <img src={n.imageUrl} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><Icons.Image /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {n.category && <span className="text-[10px] font-extrabold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">{n.category}</span>}
                          <span className="text-[11px] text-muted-foreground">{n.createdAt}</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">{n.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{n.summary}</p>
                      </div>
                    </div>
                  ))
                ) : <div className="text-sm text-center py-10 border border-dashed rounded-xl border-border">뉴스가 없습니다.</div>}
              </div>
            </section>

            {/* 인기 유저 평론 */}
            <section className="w-full bg-card rounded-2xl border border-border p-6 shadow-sm order-2 lg:order-1">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
                <button onClick={() => router.push("/review")} className="font-bold text-sm hover:text-primary transition-colors flex items-center gap-1">이번 주 인기 평론 <Icons.ChevronRight /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isMainLoading ? (
                  <div className="col-span-2 py-8 flex justify-center"><Icons.Loader /></div>
                ) : topReviews.length > 0 ? topReviews.map((r) => (
                  <div key={r.id} onClick={() => router.push(`/review/${r.game_id}`)} className="bg-muted/50 rounded-xl border border-border p-5 hover:border-primary hover:bg-card hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 truncate max-w-[150px]">{r.games?.title || "알 수 없는 게임"}</span>
                      <span className="flex items-center gap-1 text-xs font-bold text-primary"><Icons.Heart /> {r.likes ?? 0}</span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">{r.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{r.content}</p>
                  </div>
                )) : <div className="col-span-2 p-10 text-center text-muted-foreground border border-dashed rounded-xl border-border">인기 평론이 없습니다.</div>}
              </div>
            </section>

            {/* 최신 유저 평론 */}
            <section className="w-full bg-card rounded-2xl border border-border p-6 shadow-sm order-3">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
                <button onClick={() => router.push("/review")} className="font-bold text-sm hover:text-primary transition-colors flex items-center gap-1">최신 유저 평론 <Icons.ChevronRight /></button>
              </div>
              <ul className="divide-y divide-border">
                {isMainLoading ? (
                  <div className="py-8 flex justify-center"><Icons.Loader /></div>
                ) : latestReviews.length > 0 ? latestReviews.map((r) => (
                  <li key={r.id} onClick={() => router.push(`/review/${r.game_id}`)} className="py-4 hover:bg-accent transition-colors cursor-pointer group flex flex-col gap-1.5 px-3 rounded-xl">
                    <span className="text-[10px] font-bold text-primary">{r.games?.title}</span>
                    <h4 className="text-base font-bold text-foreground group-hover:text-primary truncate transition-colors">{r.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{r.content}</p>
                  </li>
                )) : <div className="p-6 text-center text-muted-foreground text-xs">최신 평론이 없습니다.</div>}
              </ul>
            </section>
          </div>

          {/* 오른쪽 컬럼 (커뮤니티) */}
          <div className="lg:col-span-4 flex flex-col gap-6 w-full">
            
            {/* ⭐ 인기 게시글 (최근 7일로 변경됨) */}
            <section className="w-full bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
                <button onClick={() => router.push("/community")} className="font-bold text-sm hover:text-primary transition-colors flex items-center gap-1">주간 인기 커뮤니티 <Icons.ChevronRight /></button>
              </div>
              <ul className="divide-y divide-border">
                {isMainLoading ? (
                   <div className="py-8 flex justify-center"><Icons.Loader /></div>
                ) : topCommunity.length > 0 ? topCommunity.map((p, idx) => (
                  <li key={p.id} onClick={() => router.push(`/community/${p.id}`)} className="py-3.5 flex items-center justify-between gap-3 cursor-pointer group px-1">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold ${idx < 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{idx + 1}</div>
                      <p className="text-sm font-bold group-hover:text-primary truncate transition-colors">{p.title}</p>
                    </div>
                    <div className="flex items-center justify-end flex-shrink-0 gap-1.5">
                      <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground"><Icons.Heart /> {p.likes ?? 0}</div>
                      <div className="text-[11px] font-black text-sky-500">{(p.comment_count ?? 0) > 0 ? `[${p.comment_count}]` : ""}</div>
                    </div>
                  </li>
                )) : <li className="text-xs py-4 text-center text-muted-foreground">게시글이 없습니다.</li>}
              </ul>
            </section>

            {/* 최근 커뮤니티 글 */}
            <section className="w-full bg-card rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-border">
                <button onClick={() => router.push("/community")} className="font-bold text-sm hover:text-primary transition-colors flex items-center gap-1">최근 커뮤니티 글 <Icons.ChevronRight /></button>
              </div>
              <ul className="divide-y divide-border">
                {isMainLoading ? (
                   <div className="py-8 flex justify-center"><Icons.Loader /></div>
                ) : latestCommunity.length > 0 ? latestCommunity.map((p) => (
                  <li key={p.id} onClick={() => router.push(`/community/${p.id}`)} className="py-3.5 flex items-center justify-between cursor-pointer group px-2 hover:bg-accent transition-colors rounded-lg">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="text-sm font-bold group-hover:text-primary truncate transition-colors">{p.title}</div>
                    </div>
                    <div className="flex items-center justify-end gap-2 flex-shrink-0">
                      <div className="text-[10px] text-muted-foreground">{formatDate(p.created_at)}</div>
                      <div className="text-[11px] font-black text-sky-500">{(p.comment_count ?? 0) > 0 ? `[${p.comment_count}]` : ""}</div>
                    </div>
                  </li>
                )) : <li className="text-xs py-6 text-center text-muted-foreground">게시글이 없습니다.</li>}
              </ul>
            </section>
          </div>

        </div>
      </main>

      <footer className="border-t border-border bg-card py-8 mt-10">
        <div className="max-w-7xl mx-auto px-6 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 GameSeed Inc.</p>
          <div className="flex gap-4">
            <span className="hover:text-foreground cursor-pointer">이용약관</span>
            <span className="hover:text-foreground cursor-pointer">개인정보처리방침</span>
            <span onClick={() => router.push("/notices")} className="hover:text-foreground cursor-pointer">공지사항</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
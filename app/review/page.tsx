"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { GAME_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const Icons = {
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  XCircle: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Filter: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
};

type Game = {
  id: number;
  title: string;
  image_url?: string;
  categories?: string[];
  release_date?: string;
  metacritic_score?: number;
  opencritic_score?: number;
  recommend_count?: number;
  average_rating?: number;
};

type FilterType = "all" | "score90" | "score70" | "recommend" | "rating";

const ITEMS_PER_PAGE = 20;

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: "all", label: "전체 목록" },
  { id: "score90", label: "90점 이상" },
  { id: "score70", label: "70점 이상" },
  { id: "recommend", label: "추천순" },
  { id: "rating", label: "평점순" },
];

const getScoreBadgeStyle = (score: number) => {
  if (score >= 80) return "bg-emerald-500 text-white";
  if (score >= 50) return "bg-amber-500 text-white";
  return "bg-rose-500 text-white";
};

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const initialSearch = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let query = supabase.from("games").select("*").order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.contains("categories", [selectedCategory]);
      }

      if (searchQuery.trim()) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (!error) setGames(data || []);
      else setGames([]);

      setLoading(false);
    };
    load();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedFilter, searchQuery]);

  const handleSearch = () => setSearchQuery(searchInput.trim());

  const getDisplayScore = (g: Game) => Math.max(g.opencritic_score || 0, g.metacritic_score || 0);

  const getAverageRating = (g: Game) =>
    typeof g.average_rating === "number" ? g.average_rating : getDisplayScore(g);

  const filteredGames = useMemo(() => {
    let result = [...games];
    if (selectedFilter === "score90") result = result.filter((g) => getDisplayScore(g) >= 90);
    else if (selectedFilter === "score70") result = result.filter((g) => getDisplayScore(g) >= 70);
    else if (selectedFilter === "recommend") result.sort((a, b) => (b.recommend_count ?? 0) - (a.recommend_count ?? 0));
    else if (selectedFilter === "rating") result.sort((a, b) => getAverageRating(b) - getAverageRating(a));
    return result;
  }, [games, selectedFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredGames.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedGames = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredGames, safeCurrentPage]);

  const getVisiblePages = () => {
    const maxVisible = 7;
    if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);

    let start = Math.max(1, safeCurrentPage - 3);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 transition-colors duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-10">
        
        {/* ⭐ 검색바 (인디고 링 & 버튼) */}
        <div className="bg-card border border-border shadow-sm rounded-2xl p-1.5 mb-6 sm:mb-12 max-w-xl mx-auto flex items-center focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:border-indigo-400 transition-all">
          <div className="pl-4 text-muted-foreground">
            <Icons.Search />
          </div>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 px-3 py-2.5 bg-transparent text-sm font-bold outline-none placeholder:text-muted-foreground text-foreground"
            placeholder="게임 제목 검색..."
          />
          {searchInput.length > 0 && (
            <button onClick={() => { setSearchInput(""); setSearchQuery(""); }} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
              <Icons.XCircle />
            </button>
          )}
          <button
            onClick={handleSearch}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm"
          >
            검색
          </button>
        </div>

        {/* 모바일 전용 필터/카테고리 버튼 */}
        <div className="lg:hidden mb-6 space-y-3">
          <div>
            <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2 px-1">필터</div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-all",
                    selectedFilter === f.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                      : "bg-card text-foreground border-border hover:border-indigo-500/50 hover:text-indigo-600"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-2 px-1">장르</div>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-all",
                  selectedCategory === "all"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                    : "bg-card text-foreground border-border hover:border-indigo-500/50 hover:text-indigo-600"
                )}
              >
                전체 보기
              </button>
              {GAME_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={cn(
                    "shrink-0 px-4 py-2 rounded-full text-xs font-black border transition-all",
                    selectedCategory === cat.slug
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20"
                      : "bg-card text-foreground border-border hover:border-indigo-500/50 hover:text-indigo-600"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 데스크톱 좌측 필터 */}
          <aside className="lg:col-span-2 sticky top-28 hidden lg:block">
            <div className="bg-card p-4 border border-border rounded-[1.5rem] shadow-sm">
              <h3 className="text-[10px] font-black mb-4 text-muted-foreground uppercase tracking-widest px-2 flex items-center gap-2">
                <Icons.Filter /> Filters
              </h3>
              <div className="space-y-1">
                {FILTER_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFilter(f.id)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                      selectedFilter === f.id
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                        : "text-muted-foreground hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 본문 */}
          <main className="lg:col-span-8">
            <div className="mb-6 flex items-baseline justify-between px-2">
              <h2 className="text-xl font-black text-foreground tracking-tight">
                {selectedCategory === "all" ? "전체 게임" : GAME_CATEGORIES.find((c) => c.slug === selectedCategory)?.name}
                <span className="ml-2 text-xs font-bold text-muted-foreground italic">({filteredGames.length})</span>
              </h2>
              <span className="text-xs font-bold text-muted-foreground">페이지 {safeCurrentPage} / {totalPages}</span>
            </div>

            {loading ? (
              <div className="py-40 text-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedGames.map((g) => {
                    const displayScore = getDisplayScore(g);
                    return (
                      <div
                        key={g.id}
                        onClick={() => router.push(`/review/${g.id}`)}
                        className="group bg-card border border-border rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
                      >
                        <div className="h-40 bg-muted overflow-hidden relative">
                          {g.image_url ? (
                            <img src={g.image_url} alt={g.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] font-black">NO IMAGE</div>
                          )}
                          {displayScore > 0 && (
                            <div className={cn("absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-[11px] font-black shadow-lg backdrop-blur-md", getScoreBadgeStyle(displayScore))}>
                              {displayScore}
                            </div>
                          )}
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-black text-foreground text-sm mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {g.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-3 text-[9px] font-black uppercase">
                            <span className="text-indigo-500">★ {getAverageRating(g).toFixed(1)}</span>
                            <span className="text-muted-foreground">{g.release_date ? new Date(g.release_date).getFullYear() : "TBA"}</span>
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[9px] font-black rounded-md uppercase truncate max-w-[80px]">
                              {GAME_CATEGORIES.find((s) => s.slug === g.categories?.[0])?.name || g.categories?.[0]}
                            </span>
                            <div className="text-[9px] font-bold text-muted-foreground group-hover:text-indigo-600 transition-colors">
                              더보기 →
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredGames.length === 0 && (
                  <div className="mt-10 p-10 text-center border border-dashed border-border rounded-3xl text-muted-foreground text-sm font-bold bg-card">
                    조건에 맞는 게임이 없습니다.
                  </div>
                )}

                {/* ⭐ 페이지네이션 (인디고 컬러 적용) */}
                {filteredGames.length > 0 && (
                  <div className="mt-10 flex items-center justify-center gap-2 flex-wrap">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={safeCurrentPage === 1}
                      className={cn(
                        "w-10 h-10 rounded-xl border text-sm font-black flex items-center justify-center transition-all",
                        safeCurrentPage === 1 ? "bg-muted text-muted-foreground/40 border-border cursor-not-allowed" : "bg-card text-foreground border-border hover:border-indigo-500/50 hover:text-indigo-600"
                      )}
                    >
                      <Icons.ChevronLeft />
                    </button>

                    {visiblePages[0] > 1 && (
                      <>
                        <button onClick={() => setCurrentPage(1)} className="w-10 h-10 rounded-xl border border-border bg-card text-sm font-black text-foreground hover:border-indigo-500/50 hover:text-indigo-600 transition-all">1</button>
                        {visiblePages[0] > 2 && <span className="px-1 text-muted-foreground font-black">...</span>}
                      </>
                    )}

                    {visiblePages.map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-10 h-10 rounded-xl border text-sm font-black transition-all",
                          safeCurrentPage === page ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20" : "bg-card text-foreground border-border hover:border-indigo-500/50 hover:text-indigo-600"
                        )}
                      >
                        {page}
                      </button>
                    ))}

                    {visiblePages[visiblePages.length - 1] < totalPages && (
                      <>
                        {visiblePages[visiblePages.length - 1] < totalPages - 1 && <span className="px-1 text-muted-foreground font-black">...</span>}
                        <button onClick={() => setCurrentPage(totalPages)} className="w-10 h-10 rounded-xl border border-border bg-card text-sm font-black text-foreground hover:border-indigo-500/50 hover:text-indigo-600 transition-all">{totalPages}</button>
                      </>
                    )}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={safeCurrentPage === totalPages}
                      className={cn(
                        "w-10 h-10 rounded-xl border text-sm font-black flex items-center justify-center transition-all",
                        safeCurrentPage === totalPages ? "bg-muted text-muted-foreground/40 border-border cursor-not-allowed" : "bg-card text-foreground border-border hover:border-indigo-500/50 hover:text-indigo-600"
                      )}
                    >
                      <Icons.ChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          {/* 데스크톱 우측 장르 */}
          <aside className="lg:col-span-2 sticky top-28 hidden lg:block max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide">
            <div className="bg-card p-4 border border-border rounded-[1.5rem] shadow-sm">
              <h3 className="text-[10px] font-black mb-4 text-muted-foreground uppercase tracking-widest px-2">Genres</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={cn(
                    "w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    selectedCategory === "all" ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-muted-foreground hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600"
                  )}
                >
                  전체 보기
                </button>
                {GAME_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={cn(
                      "w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all",
                      selectedCategory === cat.slug ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-muted-foreground hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
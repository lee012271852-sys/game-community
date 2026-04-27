"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { GAME_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Game = {
  id: number;
  title: string;
  image_url?: string;
  categories?: string[];
  created_at?: string;
};

export default function ReviewPage() {
  const router = useRouter();

  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [user, setUser] = useState<any>(null);

  // 검색용
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  /** 로그인 체크 */
  useEffect(() => {
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /** 게임 목록 불러오기 */
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      let query = supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.contains("categories", [selectedCategory]);
      }

      if (searchQuery.trim()) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error(error);
        setGames([]);
      } else {
        setGames(data || []);
      }

      setLoading(false);
    };

    load();
  }, [selectedCategory, searchQuery]);

  /** 검색 실행 */
  const handleSearch = () => {
    setSearchQuery(searchInput.trim());
  };

  /** 엔터로 검색 */
  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  /** 검색 초기화 */
  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 text-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.push("/")} className="text-2xl font-extrabold text-indigo-600 hover:text-indigo-700">GameSeed</button>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <button className="text-gray-700 hover:text-indigo-600" onClick={() => router.push("/community")}>커뮤니티</button>
            <button className="text-indigo-700 font-semibold">평론</button>
            <button className="text-gray-700 hover:text-indigo-600" onClick={() => router.push("/recommend")}>AI 추천</button>
            <button className="text-gray-700 hover:text-indigo-600" onClick={() => router.push("/news")}>뉴스</button>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600 truncate max-w-[150px]">{user.email}</span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.refresh();
                  }}
                  className="px-3 py-1.5 bg-gray-100 rounded-md text-sm hover:bg-gray-200"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button onClick={() => router.push("/auth")} className="px-3 py-1.5 border rounded-md hover:bg-gray-50 text-sm">
                  로그인
                </button>
                <button onClick={() => router.push("/auth?mode=signup")} className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* 🔍 검색바 (상단 고정형) */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 mb-8">
          <div className="flex gap-2 items-center">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={onSearchKey}
              className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="게임 제목을 검색하세요..."
            />
            {searchInput.length > 0 && (
              <button
                onClick={clearSearch}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                초기화
              </button>
            )}
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              검색
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* 카테고리 (유지) */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="bg-white p-4 border rounded-xl shadow-sm">
              <h3 className="text-sm font-bold mb-3 text-gray-700">카테고리</h3>

              <button
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "block w-full px-3 py-2 rounded-md mb-1 text-sm",
                  selectedCategory === "all"
                    ? "bg-orange-100 text-orange-800 font-bold"
                    : "hover:bg-gray-100 text-gray-700"
                )}
              >
                전체 보기
              </button>

              {GAME_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={cn(
                    "block w-full px-3 py-2 rounded-md mb-1 text-sm",
                    selectedCategory === cat.slug
                      ? "bg-orange-100 text-orange-800 font-bold"
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </aside>

          {/* 게임 목록 */}
          <main className="lg:col-span-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">게임 목록</h2>
              <span className="text-sm text-gray-600">총 {games.length}개</span>
            </div>

            {loading ? (
              <div className="text-center text-gray-500 py-10">게임 목록 로딩 중...</div>
            ) : games.length === 0 ? (
              <div className="text-center py-20 bg-white border rounded-xl">
                <p className="text-gray-500">조건에 맞는 게임이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => router.push(`/review/${g.id}`)}
                    className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-lg cursor-pointer transition-all"
                  >
                    <div className="h-44 bg-gray-200 overflow-hidden">
                      {g.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={g.image_url}
                          alt={g.title}
                          className="object-cover w-full h-full hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                      )}
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{g.title}</h3>

                      <div className="text-xs text-gray-500 mb-3">
                        {g.created_at ? new Date(g.created_at).toLocaleDateString() : ""}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {g.categories?.map((slug) => {
                          const c = GAME_CATEGORIES.find((s) => s.slug === slug);
                          return (
                            <span
                              key={slug}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-md"
                            >
                              {c?.name ?? slug}
                            </span>
                          );
                        })}
                        <span className="ml-auto px-2 py-0.5 text-indigo-600 text-[11px]">리뷰 보기 →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

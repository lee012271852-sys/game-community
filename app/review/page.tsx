"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { GAME_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// 이제 리뷰가 아니라 '게임' 정보를 가져옵니다.
type Game = {
  id: number;
  title: string;
  image_url: string;
  categories: string[];
};

export default function ReviewPage() {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      
      // 'games' 테이블에서 조회
      let query = supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.contains("categories", [selectedCategory]);
      }

      const { data, error } = await query;

      if (error) {
        console.error("게임 로딩 실패:", error);
      } else {
        setGames((data as Game[]) || []);
      }
      setLoading(false);
    };

    fetchGames();
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">게임 평론 & 리뷰</h1>
          {/* 게임 등록은 관리자만 하므로 일반 유저용 글쓰기 버튼은 삭제하거나 관리자용으로 변경 */}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* 왼쪽 카테고리 사이드바 */}
        <aside className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">카테고리</h3>
          
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm transition-colors font-medium",
              selectedCategory === "all" 
                ? "bg-orange-100 text-orange-800 font-bold" 
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            전체 보기
          </button>

          {GAME_CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md text-sm transition-colors font-medium",
                selectedCategory === cat.slug
                  ? "bg-orange-100 text-orange-800 font-bold" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              {cat.name}
            </button>
          ))}
        </aside>

        {/* 오른쪽 게임 카드 리스트 */}
        <main className="lg:col-span-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">리뷰할 게임 선택</h2>
            <p className="text-sm text-gray-500">평론을 남기고 싶은 게임을 선택해주세요.</p>
          </div>

          {loading ? (
            <p className="text-center text-gray-500 py-10">게임 목록을 불러오는 중...</p>
          ) : games.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">등록된 게임이 없습니다.</p>
              <p className="text-sm text-gray-400 mt-1">관리자에게 게임 등록을 요청하세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {games.map((game) => (
                <div 
                  key={game.id} 
                  onClick={() => router.push(`/review/${game.id}`)}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer flex flex-col h-full"
                >
                  {/* 게임 이미지 */}
                  <div className="relative h-40 bg-gray-200 overflow-hidden">
                    {game.image_url ? (
                      <img 
                        src={game.image_url} 
                        alt={game.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 bg-gray-100">No Image</div>
                    )}
                  </div>

                  {/* 게임 정보 */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                      {game.title}
                    </h3>
                    
                    <div className="mt-auto flex flex-wrap gap-1">
                      {game.categories?.map((catSlug) => {
                        const catName = GAME_CATEGORIES.find(c => c.slug === catSlug)?.name || catSlug;
                        return (
                          <span key={catSlug} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                            {catName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
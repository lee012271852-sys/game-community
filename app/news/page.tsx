"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import CategoryTabs from "@/components/gamemeca/CategoryTabs";
import MainHero from "@/components/gamemeca/MainHero";
import NewsListItem from "@/components/gamemeca/NewsListItem";
import RightSidebar from "@/components/gamemeca/RightSidebar";
import { GameMecaListItem, NewsCategory } from "@/lib/gamemeca";

const Icons = {
  Loader: () => <svg className="w-6 h-6 animate-spin text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
  ChevronLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
};

export default function NewsPage() {
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("main");
  const [mainItems, setMainItems] = useState<GameMecaListItem[]>([]);
  const [categoryItems, setCategoryItems] = useState<GameMecaListItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const listTopRef = useRef<HTMLDivElement>(null);

  // ⭐ API 최적화 1: 불필요한 중복 요청을 줄이기 위해 AbortController 사용 (옵션이지만 추천)
  const enrichItem = useCallback(async (item: GameMecaListItem): Promise<GameMecaListItem> => {
    if (item.summary && item.createdAt && item.imageUrl) return item;
    try {
      // ⭐ API 최적화 2: next의 캐시 기능 활용 (5분(300초)마다 새로고침되도록 revalidate 설정)
      const res = await fetch(`/api/gamemeca/article?url=${encodeURIComponent(item.articleUrl)}`, {
        next: { revalidate: 300 } 
      });
      if (res.ok) {
        const detail = await res.json();
        return { ...item, summary: item.summary || detail.summary || "", createdAt: item.createdAt || detail.createdAt || "", imageUrl: item.imageUrl || detail.imageUrl || "" };
      }
    } catch (e) { console.error(e); }
    return item;
  }, []);

  useEffect(() => {
    const loadHeroData = async () => {
      try {
        // ⭐ 메인 뉴스도 캐싱 적용
        const res = await fetch("/api/gamemeca/list?category=main", { next: { revalidate: 300 } });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          const enriched = await Promise.all(data.slice(0, 5).map(item => enrichItem(item)));
          setMainItems(enriched);
        }
      } catch (err) { console.error(err); }
    };
    loadHeroData();
  }, [enrichItem]);

  useEffect(() => {
    const loadCategoryData = async () => {
      setLoading(true);
      setCurrentPage(1);
      try {
        const res = await fetch(`/api/gamemeca/list?category=${activeCategory}`, { next: { revalidate: 300 } });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) setCategoryItems(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadCategoryData();
  }, [activeCategory]);

  const totalPages = Math.ceil(categoryItems.length / ITEMS_PER_PAGE);
  const currentItems = categoryItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const popularNewsData = mainItems.slice(0, 5).map(item => ({
    title: item.title,
    articleUrl: `/news/detail?url=${encodeURIComponent(item.articleUrl)}`,
  }));

  const latestNewsData = categoryItems.slice(0, 5).map(item => ({
    title: item.title,
    articleUrl: `/news/detail?url=${encodeURIComponent(item.articleUrl)}`,
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground pb-20 transition-colors duration-300">
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* 배너 섹션 */}
        <section className="mb-6">
          <div className="rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 relative">
            {/* ⭐ 로딩 중일 때 깜빡임을 방지하는 최소 높이 설정 */}
            <div className="min-h-[300px]">
               <MainHero items={mainItems.slice(0, 3)} />
            </div>
          </div>
        </section>

        {/* 카테고리 탭 (스티키) */}
        <div className="sticky top-[64px] z-30 py-3 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md mb-4">
          <div className="p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm w-fit mx-auto">
            <CategoryTabs activeCategory={activeCategory} onChange={setActiveCategory} />
          </div>
        </div>

        <div ref={listTopRef} className="scroll-mt-28"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 뉴스 리스트 */}
          <section className="lg:col-span-8 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              {loading ? (
                <div className="py-40 flex flex-col items-center justify-center text-slate-400 font-bold gap-4">
                  <Icons.Loader />
                  <p className="text-sm">기사를 업데이트 중입니다...</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentItems.map((item) => (
                      <NewsListItem key={item.articleUrl} item={item} />
                    ))}
                  </div>

                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="py-8 flex justify-center items-center gap-1.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                      <button 
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30"
                      >
                        <Icons.ChevronLeft />
                      </button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                          <button
                            key={num}
                            onClick={() => handlePageChange(num)}
                            className={`w-9 h-9 rounded-lg text-sm font-black transition-all ${
                              currentPage === num 
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                                : "text-slate-400 hover:bg-white dark:hover:bg-slate-800 border border-transparent"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30"
                      >
                        <Icons.ChevronRight />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* 사이드바 */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
              <RightSidebar 
                latestNews={latestNewsData} 
                popularNews={popularNewsData} 
              />
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
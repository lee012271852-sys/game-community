"use client";

import { useState } from "react";
import Link from "next/link";

type SidebarItem = {
  title: string;
  articleUrl: string;
};

type Props = {
  latestNews?: SidebarItem[];
  popularNews?: SidebarItem[];
};

export default function RightSidebar({ latestNews = [], popularNews = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"latest" | "popular">("latest");

  const currentItems = activeTab === "latest" ? latestNews : popularNews;

  return (
    <aside className="w-full">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300">
        
        {/* 탭 버튼 영역 */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("latest")}
            className={`flex-1 px-4 py-4 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === "latest"
                ? "bg-indigo-600 text-white shadow-inner"
                : "bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
            aria-selected={activeTab === "latest"}
          >
            최신 뉴스
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("popular")}
            className={`flex-1 px-4 py-4 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeTab === "popular"
                ? "bg-indigo-600 text-white shadow-inner"
                : "bg-slate-50/50 dark:bg-slate-800/30 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
            aria-selected={activeTab === "popular"}
          >
            인기 뉴스
          </button>
        </div>

        {/* 리스트 영역 */}
        <div className="p-6">
          <ol className="space-y-5">
            {currentItems.length > 0 ? (
              currentItems.map((item, index) => (
                // ⭐ group 클래스를 Link 태그 쪽으로 이동시켜 클릭 영역 전체에서 호버 효과가 매끄럽게 작동하도록 수정
                <li key={`${item.articleUrl}-${index}`} className="flex items-start gap-4">
                  
                  {/* 순위/점 표시 */}
                  <span className={`flex-shrink-0 flex items-center justify-center transition-colors duration-300 ${
                    activeTab === "popular" 
                      ? `w-6 h-6 rounded-xl text-[11px] font-black ${
                          index < 3 
                            ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        }`
                      : "w-6 h-6 text-slate-300 dark:text-slate-600 font-black text-lg"
                  }`}>
                    {activeTab === "popular" ? index + 1 : "·"}
                  </span>

                  <Link 
                    href={item.articleUrl} 
                    className="flex-1 min-w-0 group" // ⭐ group 속성을 여기로
                    title={item.title} // 마우스를 올렸을 때 전체 제목이 보이도록 툴팁 추가
                  >
                    <p className="line-clamp-2 text-[13px] font-bold leading-relaxed text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                      {item.title}
                    </p>
                  </Link>
                </li>
              ))
            ) : (
              <div className="py-16 flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                  Loading...
                </p>
              </div>
            )}
          </ol>
        </div>

        {/* 푸터 영역 */}
        <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-center">
           <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
             {activeTab === "latest" ? "Just Updated" : "Hottest Now"}
           </p>
        </div>
      </div>
    </aside>
  );
}
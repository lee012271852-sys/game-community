"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const routeNames: Record<string, string> = {
  "/": "홈",
  "/community": "커뮤니티",
  "/review": "게임 평론",
  "/user-review": "유저 리뷰",
  "/news": "뉴스",
  "/mypage": "마이페이지",
};

type Tab = { name: string; path: string };
type RecentGame = { id: number; title: string; url: string };

export default function RecentTabs() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadRecentGames = () => {
    const saved = localStorage.getItem("recentGames");
    if (saved) setRecentGames(JSON.parse(saved));
  };

  useEffect(() => {
    setMounted(true);
    
    const savedTabs = localStorage.getItem("recentTabs");
    if (savedTabs) setTabs(JSON.parse(savedTabs));
    
    loadRecentGames();

    window.addEventListener("recentGamesUpdated", loadRecentGames);
    return () => window.removeEventListener("recentGamesUpdated", loadRecentGames);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const baseRoute = "/" + pathname.split("/")[1]; 
    const isDetailPage = pathname.split("/").length > 2;
    const tabName = routeNames[baseRoute] || (pathname === "/" ? routeNames["/"] : null);

    if (tabName && !isDetailPage) {
      setTabs((prev) => {
        const filteredTabs = prev.filter((t) => t.path !== baseRoute);
        const newTabs = [{ name: tabName, path: baseRoute }, ...filteredTabs].slice(0, 5);
        localStorage.setItem("recentTabs", JSON.stringify(newTabs));
        return newTabs;
      });
    }
  }, [pathname, mounted]);

  const removeTab = (e: React.MouseEvent, pathToRemove: string) => {
    e.stopPropagation();
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.path !== pathToRemove);
      localStorage.setItem("recentTabs", JSON.stringify(newTabs));
      return newTabs;
    });
  };

  const removeGame = (e: React.MouseEvent, gameId: number) => {
    e.stopPropagation();
    setRecentGames((prev) => {
      const newGames = prev.filter((g) => g.id !== gameId);
      localStorage.setItem("recentGames", JSON.stringify(newGames));
      return newGames;
    });
  };

  if (!mounted) return null;

  return (
    <div className="hidden lg:flex w-full items-center justify-between px-6 py-2 bg-background border-b border-border shadow-sm overflow-hidden">
      
      {/* 👈 왼쪽: 메인 카테고리 탭 영역 */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pr-4 flex-1">
        <span className="text-xs font-black text-muted-foreground mr-2 whitespace-nowrap">
          최근 메뉴
        </span>
        {tabs.map((tab) => {
          const isDetailPage = pathname.split("/").length > 2;
          const isActive = pathname.startsWith(tab.path) && !isDetailPage && (tab.path !== "/" || pathname === "/");

          return (
            <div
              key={tab.path}
              onClick={() => router.push(tab.path)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
              }`}
            >
              {tab.name}
              <button onClick={(e) => removeTab(e, tab.path)} className="w-4 h-4 rounded-md flex items-center justify-center opacity-50 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          );
        })}
      </div>

      {/* 👉 오른쪽: 최근 본 게임 리뷰 영역 (우측 고정 & 글자 자르기 적용 & 아이콘 제거) */}
      {recentGames.length > 0 && (
        <div className="flex items-center justify-end gap-2 pl-4 border-l border-border overflow-x-auto custom-scrollbar ml-auto">
          <span className="text-[11px] font-black text-indigo-500 uppercase tracking-wider mr-1 whitespace-nowrap flex items-center gap-1 flex-shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            최근 본 글
          </span>
          
          <div className="flex items-center gap-2 justify-end">
            {recentGames.map((game) => {
              const isActive = pathname === game.url;
              return (
                <div
                  key={game.id}
                  onClick={() => router.push(game.url)}
                  // 너비 제한
                  className={`group flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all border shadow-sm max-w-[140px] w-auto ${
                    isActive
                      ? "bg-indigo-500 text-white border-indigo-600"
                      : "bg-muted text-foreground border-border hover:border-indigo-500/50 hover:text-indigo-500"
                  }`}
                  title={game.title}
                >
                  {/* 길면 자르고, 🎮 아이콘도 제거됨 */}
                  <span className="truncate flex-1">{game.title}</span>
                  <button onClick={(e) => removeGame(e, game.id)} className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 hover:bg-black/20 dark:hover:bg-white/20 transition-all">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
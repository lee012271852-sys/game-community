"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import ThemeToggle from "./ThemeToggle";

const Icons = {
  Menu: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Close: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  XMark: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  User: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Bookmark: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
  FileText: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
  MessageCircle: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Mail: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Logout: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  UserIconLg: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  // ⭐ 새 알림이 있을 때 흔들리는 효과 추가 (isRinging)
  Bell: ({ isRinging }: { isRinging?: boolean }) => (
    <svg className={`w-5 h-5 ${isRinging ? 'origin-top animate-bounce text-indigo-600 dark:text-indigo-400' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
};

const NAV_MENUS = [
  { path: "community", label: "커뮤니티" },
  { path: "review", label: "평론" },
  { path: "user-review", label: "유저 리뷰" },
  { path: "recommend", label: "AI 추천" },
  { path: "news", label: "뉴스" },
];

// ⭐ 알림 타입에 "notice" 추가
type Notification = {
  id: number;
  type: "comment" | "reply" | "message" | "notice"; 
  actor_nickname: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotiMenuOpen, setIsNotiMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [headerSearch, setHeaderSearch] = useState("");
  const [notiTab, setNotiTab] = useState<"noti" | "message">("noti");

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      if (data.session?.user) fetchNotifications(data.session.user.id);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchNotifications(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('header-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, 
      (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsNotiMenuOpen(false);
  }, [pathname]);

  const fetchNotifications = async (userId: string) => {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    if (!error && data) setNotifications(data);
  };

  const handleNotiClick = async (noti: Notification) => {
    if (!noti.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', noti.id);
      setNotifications(prev => prev.map(n => n.id === noti.id ? { ...n, is_read: true } : n));
    }
    setIsNotiMenuOpen(false);
    router.push(noti.link);
  };

  const handleDeleteNoti = async (e: React.MouseEvent, notiId: number) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== notiId));
    await supabase.from('notifications').delete().eq('id', notiId);
  };

  const handleMarkAllAsReadFiltered = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const unreadIds = filteredNotifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
  };

  const handleUserMenuClick = (tab: string) => {
    setIsUserMenuOpen(false);
    router.push(`/mypage?tab=${tab}`);
  };

  const onSearchSubmit = () => {
    if (!headerSearch.trim()) return;
    router.push(`/search?q=${encodeURIComponent(headerSearch.trim())}`);
    setHeaderSearch("");
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const unreadNotiCount = notifications.filter(n => !n.is_read && n.type !== "message").length;
  const unreadMsgCount = notifications.filter(n => !n.is_read && n.type === "message").length;
  const filteredNotifications = notifications.filter(n => notiTab === "message" ? n.type === "message" : n.type !== "message");

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center relative">
        
        <button onClick={() => router.push("/")} className="text-2xl font-extrabold font-sans text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 relative z-50 transition-colors">
          GameSeed
        </button>

        <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 text-sm font-bold">
          {NAV_MENUS.map((menu) => (
            <button key={menu.path} onClick={() => router.push(`/${menu.path}`)} className={`transition-colors ${pathname === `/${menu.path}` ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"}`}>
              {menu.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4 relative z-50">
          
          <div className="hidden sm:flex relative items-center">
            <div className="absolute left-3 text-slate-400 pointer-events-none"><Icons.Search /></div>
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit(); }}
              placeholder="통합 검색..."
              className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-full text-sm font-medium text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-700 focus:border-indigo-400 transition-all duration-300 outline-none w-32 focus:w-48 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 border-l border-slate-200 dark:border-slate-700 pl-2 sm:pl-4">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-3">
                <div className="relative">
                  
                  {/* ⭐ 안 읽은 알림이 있을 때 종 흔들림 (isRinging) */}
                  <button onClick={() => { setIsNotiMenuOpen(!isNotiMenuOpen); setIsUserMenuOpen(false); }} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative ${isNotiMenuOpen ? "bg-indigo-600 text-white shadow-lg scale-105" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                    <Icons.Bell isRinging={unreadCount > 0} />
                    {unreadCount > 0 && <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900"></span>}
                  </button>

                  {isNotiMenuOpen && (
                    <div className="fixed left-4 right-4 top-[72px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 w-auto sm:w-[340px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                      <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold">
                        <button onClick={() => setNotiTab("noti")} className={`flex-1 py-3 text-center transition-colors relative ${notiTab === "noti" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600" : "text-slate-500"}`}>알림 {unreadNotiCount > 0 && `(${unreadNotiCount})`}</button>
                        <button onClick={() => setNotiTab("message")} className={`flex-1 py-3 text-center transition-colors relative ${notiTab === "message" ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600" : "text-slate-500"}`}>쪽지 {unreadMsgCount > 0 && `(${unreadMsgCount})`}</button>
                        <button onClick={handleMarkAllAsReadFiltered} className="px-4 py-3 text-slate-400 hover:text-indigo-500 transition-colors border-l border-slate-200 dark:border-slate-700">모두 읽음</button>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto custom-scrollbar bg-card">
                        {filteredNotifications.length > 0 ? (
                          <ul className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {filteredNotifications.map((noti) => (
                              <li key={noti.id} onClick={() => handleNotiClick(noti)} className={`px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 flex gap-3 items-center ${noti.is_read ? 'opacity-50' : 'bg-indigo-50/20 dark:bg-indigo-900/10'}`}>
                                <div className="flex-1 min-w-0 pr-1">
                                  
                                  {/* ⭐ 알림 타입이 notice일 때 전용 UI 출력 */}
                                  {noti.type === 'notice' ? (
                                    <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-snug">
                                      <span className="font-extrabold text-indigo-600 dark:text-indigo-400">📢 공지사항</span> - {noti.message}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-snug">
                                      <span className="font-extrabold">{noti.actor_nickname}</span>님이 {noti.message}
                                    </p>
                                  )}

                                  <p className="text-[10px] text-slate-400 mt-1 font-bold">{new Date(noti.created_at).toLocaleDateString()}</p>
                                </div>
                                <button onClick={(e) => handleDeleteNoti(e, noti.id)} className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors"><Icons.XMark /></button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="py-12 text-center text-xs font-bold text-slate-400">내역이 없습니다.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotiMenuOpen(false); }} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isUserMenuOpen ? "bg-indigo-600 text-white shadow-lg scale-105" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>
                    <Icons.UserIconLg />
                  </button>
                  {isUserMenuOpen && (
                    <div className="fixed left-4 right-4 top-[72px] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-3 w-auto sm:w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-[60] animate-in fade-in zoom-in-95 duration-200 origin-top">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">내 계정</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <button onClick={() => handleUserMenuClick("info")} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600"><Icons.User /> 마이페이지</button>
                        <button onClick={() => handleUserMenuClick("scraps")} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600"><Icons.Bookmark /> 나의 스크랩</button>
                        <button onClick={() => handleUserMenuClick("posts")} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600"><Icons.FileText /> 작성글</button>
                        <button onClick={() => handleUserMenuClick("comments")} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600"><Icons.MessageCircle /> 작성댓글</button>
                        <button onClick={() => handleUserMenuClick("messages")} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600"><Icons.Mail /> 쪽지함</button>
                      </div>
                      <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                      <button onClick={async () => { await supabase.auth.signOut(); setIsUserMenuOpen(false); router.refresh(); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Icons.Logout /> 로그아웃</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => router.push("/auth/login")} className="text-sm font-semibold text-slate-600 dark:text-slate-300 px-2 sm:px-3 py-2 hover:text-indigo-600 transition-colors">로그인</button>
                <button onClick={() => router.push("/auth/signup")} className="text-sm font-semibold text-white bg-indigo-600 px-3 sm:px-4 py-2 rounded-full hover:bg-indigo-700 shadow-md">회원가입</button>
              </div>
            )}
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-slate-600 dark:text-slate-300">
            {isMobileMenuOpen ? <Icons.Close /> : <Icons.Menu />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xl flex flex-col font-bold text-sm z-40 animate-in slide-in-from-top-4 duration-200">
          <div className="p-4 border-b border-slate-50 dark:border-slate-800">
             <input type="text" value={headerSearch} onChange={(e) => setHeaderSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onSearchSubmit(); }} placeholder="통합 검색..." className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl outline-none text-sm font-bold" />
          </div>
          {NAV_MENUS.map((menu) => (
            <button key={menu.path} onClick={() => router.push(`/${menu.path}`)} className="p-4 text-left text-slate-600 dark:text-slate-300 border-b border-slate-50 dark:border-slate-800">{menu.label}</button>
          ))}
          <div className="p-5 bg-slate-50 dark:bg-slate-800/50">
            {user ? (
              <div className="flex flex-col gap-3">
                <button onClick={() => handleUserMenuClick("info")} className="flex items-center gap-2 py-1.5"><Icons.User /> 마이페이지</button>
                <button onClick={() => handleUserMenuClick("messages")} className="flex items-center gap-2 py-1.5"><Icons.Mail /> 쪽지함</button>
                <button onClick={async () => { await supabase.auth.signOut(); router.refresh(); }} className="flex items-center gap-2 text-rose-500 py-1.5"><Icons.Logout /> 로그아웃</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push("/auth/login")} className="w-full py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center shadow-sm">로그인</button>
                <button onClick={() => router.push("/auth/signup")} className="w-full py-2.5 bg-indigo-600 rounded-xl text-white text-center shadow-sm">회원가입</button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
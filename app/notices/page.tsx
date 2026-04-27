"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient"; 

interface Notice {
  id: number;
  created_at: string;
  title: string;
  author: string;
  is_important: boolean;
  views?: number; // 나중에 조회수 기능 넣을 걸 대비해 둠
}

const Icons = {
  Megaphone: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
};

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const { data, error } = await supabase
          .from("notices")
          .select("id, created_at, title, author, is_important") // 리스트에서는 내용은 안 가져와도 됨 (속도 최적화)
          .order("is_important", { ascending: false }) // 1순위: 중요 공지가 무조건 위로 (고정)
          .order("created_at", { ascending: false });  // 2순위: 최신순 정렬

        if (error) throw error;
        if (data) setNotices(data);
      } catch (error) {
        console.error("공지사항 불러오기 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotices();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    // 오늘 쓴 글이면 '시간:분'으로 표시하고, 예전 글이면 '년.월.일'로 표시하는 커뮤니티 국룰 디테일!
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" }).replace(/\./g, '. ').trim();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        
        {/* 게시판 타이틀 영역 */}
        <div className="mb-6 flex items-center gap-3 border-b-2 border-foreground pb-4">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Icons.Megaphone />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">공지사항</h1>
            <p className="text-sm text-muted-foreground mt-0.5">GameSeed의 공식 안내 및 패치노트</p>
          </div>
        </div>

        {/* 클래식 게시판 리스트 */}
        <div className="bg-card border border-border shadow-sm rounded-xl overflow-hidden">
          
          {/* PC용 테이블 헤더 (모바일에서는 숨김) */}
          <div className="hidden md:flex items-center px-4 py-3 bg-muted/50 border-b border-border text-xs font-bold text-muted-foreground text-center">
            <div className="w-16">번호</div>
            <div className="flex-1">제목</div>
            <div className="w-24">작성자</div>
            <div className="w-24">등록일</div>
          </div>

          <div className="divide-y divide-border">
            {notices.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground font-medium">
                등록된 공지사항이 없습니다.
              </div>
            ) : (
              notices.map((notice, index) => (
                <div 
                  key={notice.id}
                  onClick={() => router.push(`/notices/${notice.id}`)} // 클릭 시 상세 페이지로 이동!
                  className={`flex items-center px-4 py-3 sm:py-4 cursor-pointer transition-colors ${
                    notice.is_important ? "bg-red-50/40 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20" : "hover:bg-muted/40"
                  }`}
                >
                  {/* 번호 / 뱃지 */}
                  <div className="hidden md:block w-16 text-center">
                    {notice.is_important ? (
                      <span className="px-2 py-0.5 bg-red-500 text-white rounded text-[11px] font-black tracking-widest">필독</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{notices.length - index}</span>
                    )}
                  </div>

                  {/* 제목 영역 */}
                  <div className="flex-1 overflow-hidden pr-4">
                    <div className="flex items-center gap-2">
                      {/* 모바일용 뱃지 (PC에선 숨김) */}
                      <span className="md:hidden flex-shrink-0">
                        {notice.is_important && <span className="px-2 py-0.5 bg-red-500 text-white rounded text-[10px] font-black">필독</span>}
                      </span>
                      <span className={`font-bold truncate text-sm sm:text-base ${notice.is_important ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                        {notice.title}
                      </span>
                    </div>
                    {/* 모바일용 작성자/날짜 (PC에선 숨김) */}
                    <div className="md:hidden flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                      <span>{notice.author}</span>
                      <span>|</span>
                      <span>{formatDate(notice.created_at)}</span>
                    </div>
                  </div>

                  {/* 작성자 (PC) */}
                  <div className="hidden md:block w-24 text-center text-sm font-medium text-muted-foreground truncate">
                    {notice.author}
                  </div>

                  {/* 등록일 (PC) */}
                  <div className="hidden md:block w-24 text-center text-xs text-muted-foreground">
                    {formatDate(notice.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
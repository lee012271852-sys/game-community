"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

interface Notice {
  id: number;
  title: string;
  is_important: boolean;
}

const Icons = {
  ChevronRight: () => (
    <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  Megaphone: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  )
};

export default function NoticeBanner({ targetPage }: { targetPage: string }) {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const fetchNotices = async () => {
      // 해당 페이지용 공지 + '전체(all)' 공지를 같이 불러옵니다.
      const { data } = await supabase
        .from("notices")
        .select("id, title, is_important")
        .in("target_page", [targetPage, "all"])
        .order("is_important", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(2);

      if (data) setNotices(data);
    };

    fetchNotices();
  }, [targetPage]);

  if (notices.length === 0) return null;

  return (
    <div className="w-full bg-card border border-border shadow-sm rounded-2xl mb-8 overflow-hidden animate-in fade-in slide-in-from-top-4">
      <div className="divide-y divide-border">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            <div className="flex-shrink-0 flex items-center justify-center">
              {notice.is_important ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500 text-white text-[10px] font-black tracking-widest shadow-sm">
                  필독
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-black tracking-widest">
                  공지
                </span>
              )}
            </div>
            
            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate flex-1">
              {notice.title}
            </p>
            
            <Icons.ChevronRight />
          </div>
        ))}
      </div>
    </div>
  );
}
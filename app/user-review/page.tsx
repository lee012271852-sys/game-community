"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Flame: () => <svg className="w-4 h-4 text-orange-500 fill-orange-500" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 7 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>,
  User: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Message: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
};

type UserReview = {
  id: number;
  author: string;
  game_title: string;
  title: string;
  rating: number; // 꿀잼 지수로 활용
  thumbnail_url?: string;
  created_at: string;
};

export default function UserReviewPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data, error } = await supabase.from("user_reviews").select("*").order("created_at", { ascending: false });
    if (!error && data) setReviews(data);
    setLoading(false);
  };

  const getHeatColor = (rating: number) => {
    if (rating >= 80) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
    if (rating >= 50) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-blue-500 bg-blue-500/10 border-blue-500/20";
  };

  if (loading) return <div className="min-h-screen bg-background flex justify-center items-center font-bold text-muted-foreground">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 transition-colors duration-300">
      <main className="max-w-7xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black mb-2 tracking-tight">게이머 라운지</h1>
            <p className="text-muted-foreground text-sm font-medium">플레이 중 버그, 명장면을 스샷과 함께 공유해보세요!</p>
          </div>
          <button 
            onClick={() => router.push("/user-review/write")}
            className="shrink-0 flex items-center justify-center gap-1.5 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 transition-all active:scale-95"
          >
            <Icons.Plus /> 내 상황 공유하기
          </button>
        </div>

        {reviews.length > 0 ? (
          // ⭐ 16:9 비율에 맞춘 시원한 그리드
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {reviews.map((review) => (
              <div key={review.id} onClick={() => router.push(`/user-review/${review.id}`)} className="group cursor-pointer flex flex-col">
                
                {/* ⭐ 가로형(16:9) 썸네일 (스샷, 움짤에 최적화) */}
                <div className="w-full aspect-video bg-card border border-border rounded-2xl relative overflow-hidden mb-4 shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1">
                  {review.thumbnail_url ? (
                    <img src={review.thumbnail_url} alt={review.game_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted p-4 text-center">
                      <span className="text-4xl font-black opacity-30 mb-2">{review.game_title[0]}</span>
                      <span className="text-xs font-bold opacity-50 line-clamp-1">{review.game_title}</span>
                    </div>
                  )}
                  
                  {/* 불꽃 뱃지 (재미/분노 지수) */}
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm backdrop-blur-md border font-black ${getHeatColor(review.rating)}`}>
                    <Icons.Flame />
                    <span className="text-xs">{review.rating}°C</span>
                  </div>
                </div>

                <div className="flex flex-col px-1">
                  <div className="text-[11px] font-extrabold text-primary mb-1.5 line-clamp-1 tracking-tight">
                    {review.game_title}
                  </div>
                  <h3 className="text-base font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-3">
                    {review.title}
                  </h3>
                  
                  <div className="mt-auto flex justify-between items-center text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5">
                      <Icons.User />
                      <span className="truncate max-w-[100px]">{review.author.split("@")[0]}</span>
                    </div>
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center bg-card rounded-3xl border border-dashed border-border text-center shadow-sm">
            <div className="text-5xl mb-4 opacity-50">📸</div>
            <p className="text-lg font-bold text-foreground mb-2">아직 공유된 플레이 상황이 없습니다.</p>
            <p className="text-sm text-muted-foreground">오늘 겪은 레전드 장면을 가장 먼저 자랑해보세요!</p>
          </div>
        )}
      </main>
    </div>
  );
}
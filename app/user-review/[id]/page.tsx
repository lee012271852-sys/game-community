"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

const Icons = {
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Flame: () => <svg className="w-5 h-5 text-orange-500 fill-orange-500" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 7 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Gamepad: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Heart: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
};

type UserReview = {
  id: number;
  user_id: string;
  author: string;
  game_title: string;
  title: string;
  content: string;
  rating: number;
  thumbnail_url?: string;
  views: number;
  likes: number;
  created_at: string;
};

export default function UserReviewDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [review, setReview] = useState<UserReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);

      const { data } = await supabase.from("user_reviews").select("*").eq("id", id).single();
      setReview(data);
      setLoading(false);
    };
    initData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("이 게시물을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("user_reviews").delete().eq("id", id);
    if (!error) {
      alert("삭제되었습니다.");
      router.push("/user-review");
    }
  };

  const getHeatColor = (rating: number) => {
    if (rating >= 80) return "text-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20";
    if (rating >= 50) return "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
    return "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
  };

  if (loading) return <div className="min-h-screen bg-background flex justify-center items-center font-bold text-muted-foreground">로딩 중...</div>;
  if (!review) return <div className="min-h-screen bg-background flex justify-center items-center font-bold text-muted-foreground">게시물을 찾을 수 없습니다.</div>;

  const isAuthor = currentUser && currentUser.id === review.user_id;

  return (
    <div className="min-h-screen bg-background text-foreground py-8 transition-colors duration-300">
      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.push("/user-review")} className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
            <Icons.ArrowLeft /> 목록으로
          </button>

          {isAuthor && (
            <div className="flex gap-2">
              <button onClick={() => router.push(`/user-review/edit/${id}`)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-foreground bg-card hover:bg-accent border border-border rounded-md transition-colors shadow-sm">
                <Icons.Edit /> 수정
              </button>
              <button onClick={handleDelete} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 rounded-md transition-colors shadow-sm">
                <Icons.Trash /> 삭제
              </button>
            </div>
          )}
        </div>

        <article>
          {/* 타이틀 및 정보 영역 */}
          <header className="mb-6">
            <div className="inline-flex items-center gap-1.5 text-primary font-bold text-sm mb-3">
              <Icons.Gamepad /> {review.game_title}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black leading-snug tracking-tight mb-4 text-foreground">
              {review.title}
            </h1>
            
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                <span className="font-bold text-foreground">{review.author.split("@")[0]}</span>
                <span>·</span>
                <span>{new Date(review.created_at).toLocaleDateString()}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Icons.Eye /> {review.views || 0}</span>
              </div>

              {/* 불꽃 온도계 (상황 지수) */}
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm font-black ${getHeatColor(review.rating)}`}>
                <Icons.Flame />
                <span className="text-lg leading-none">{review.rating}°C</span>
              </div>
            </div>
          </header>

          {/* ⭐ 메인 스크린샷 (16:9 꽉 차게) */}
          {review.thumbnail_url && (
            <div className="w-full aspect-video bg-muted rounded-2xl overflow-hidden shadow-sm border border-border mb-8">
              <img src={review.thumbnail_url} alt={review.game_title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* 본문 텍스트 */}
          <div 
            className="prose dark:prose-invert max-w-none 
                       prose-p:leading-loose prose-p:text-foreground/90 prose-p:text-[16px]
                       prose-img:rounded-xl prose-img:border prose-img:border-border"
            dangerouslySetInnerHTML={{ __html: review.content }} 
          />
        </article>

        <div className="mt-16 pt-8 border-t border-border flex justify-center gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-muted hover:bg-accent text-foreground font-bold rounded-full transition-colors shadow-sm">
            <Icons.Heart /> 추천 {review.likes || 0}
          </button>
        </div>

      </main>
    </div>
  );
}
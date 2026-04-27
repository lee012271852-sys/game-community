"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { useToast } from "@/app/components/ToastProvider";

const Icons = {
  Image: () => <svg className="w-8 h-8 text-muted-foreground opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Gamepad: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>,
  Flame: () => <svg className="w-5 h-5 text-orange-500 fill-orange-500" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 7 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>,
  Loader: () => <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
};

export default function UserReviewWritePage() {
  const router = useRouter();
  const { triggerToast } = useToast();
  const [user, setUser] = useState<any>(null);
  
  const [gameTitle, setGameTitle] = useState("");
  const [title, setTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(80);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        triggerToast("⚠️ 로그인이 필요합니다.");
        router.push("/auth/login");
      } else {
        setUser(data.session.user);
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async () => {
    if (!gameTitle.trim() || !title.trim() || !content.trim()) {
      return triggerToast("⚠️ 게임 이름, 제목, 본문 내용은 필수입니다!");
    }

    setSubmitting(true);
    const { error } = await supabase.from("user_reviews").insert({
      user_id: user.id,
      author: user.email,
      game_title: gameTitle.trim(),
      title: title.trim(),
      thumbnail_url: thumbnailUrl.trim() || null,
      content: content.trim(),
      rating: rating,
    });

    setSubmitting(false);

    if (error) {
      triggerToast("❌ 등록 실패: " + error.message);
    } else {
      triggerToast("✨ 상황이 성공적으로 공유되었습니다!");
      router.push("/user-review");
    }
  };

  const getHeatColor = (score: number) => {
    if (score >= 80) return "text-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20";
    if (score >= 50) return "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
    return "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground py-10 transition-colors duration-300">
      <main className="max-w-3xl mx-auto px-4 sm:px-6">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2">📸 내 상황 공유하기</h1>
          <p className="text-sm font-medium text-muted-foreground">꿀잼 버그, 레전드 억까 등 재미있는 플레이 상황을 스샷과 함께 올려주세요!</p>
        </div>

        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden flex flex-col">
          
          <div className="p-6 sm:p-10 border-b border-border bg-muted/30 space-y-6">
            
            {/* ⭐ 가로형(16:9) 메인 스크린샷 폼 */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex justify-between">
                <span>메인 스크린샷 / 움짤 URL (선택)</span>
                <span className="text-[10px] text-primary">가로 형태(16:9)를 권장합니다.</span>
              </label>
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center mb-3">
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt="Thumbnail Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Icons.Image />
                    <span className="text-[11px] font-bold">이미지 미리보기</span>
                  </div>
                )}
              </div>
              <input 
                type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} 
                placeholder="이미지 주소를 붙여넣으세요 (https://...)" 
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Icons.Gamepad /> 어떤 게임인가요? <span className="text-destructive">*</span>
                </label>
                <input 
                  type="text" value={gameTitle} onChange={(e) => setGameTitle(e.target.value)} 
                  placeholder="예: 폴아웃 4, 사이버펑크..." 
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm font-bold text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm" 
                />
              </div>

              {/* ⭐ 온도계 슬라이더 (재미/혈압) */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                  <span>상황 온도계 (꿀잼/혈압 지수)</span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-black border flex items-center gap-1 ${getHeatColor(rating)}`}>
                    <Icons.Flame /> {rating}°C
                  </span>
                </label>
                <div className="pt-1">
                  <input 
                    type="range" min={0} max={100} value={rating} onChange={(e) => setRating(Number(e.target.value))} 
                    className="w-full h-2.5 bg-muted rounded-lg appearance-none cursor-pointer accent-orange-500" 
                  />
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground mt-2 px-1">
                    <span className="text-blue-500">0°C (노잼/식음)</span>
                    <span className="text-orange-500">100°C (꿀잼/개빡침)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 sm:p-10 flex flex-col gap-6">
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">상황 요약 제목 <span className="text-destructive">*</span></label>
              <input 
                type="text" value={title} onChange={(e) => setTitle(e.target.value)} 
                placeholder="예: 말 타다가 우주로 승천한 썰 푼다 ㅋㅋㅋ" 
                className="w-full px-4 py-3 sm:py-4 bg-muted/50 border border-border rounded-xl text-lg font-black text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
              />
            </div>

            <div className="space-y-2 flex-1">
              <label className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">상세 썰 풀기 <span className="text-destructive">*</span></label>
              <textarea 
                value={content} onChange={(e) => setContent(e.target.value)} 
                placeholder="무슨 일이 있었는지 편하게 적어주세요!" 
                className="w-full min-h-[250px] px-5 py-4 bg-muted/50 border border-border rounded-xl text-[15px] leading-relaxed text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y" 
              />
            </div>
          </div>

          <div className="p-6 sm:px-10 sm:py-6 border-t border-border bg-muted/30 flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button onClick={() => router.back()} disabled={submitting} className="px-6 py-3 font-bold text-muted-foreground bg-background border border-border hover:bg-muted rounded-xl transition-colors disabled:opacity-50">
              취소
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="px-8 py-3 font-bold text-primary-foreground bg-primary rounded-xl shadow-md hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2">
              {submitting ? <><Icons.Loader /> 등록 중...</> : "라운지에 공유하기"}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
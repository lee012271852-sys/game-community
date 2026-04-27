"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { GAME_CATEGORIES } from "@/lib/constants";

const Icons = {
  ChevronLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  
  StarOutline: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  StarSolid: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>,
  
  HeartOutline: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  Clock: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
};

type Review = { id: number; content: string; rating: number; author: string; user_id: string | null; created_at: string; game_id?: number; likes?: number; playtime?: number; };
type Game = { id: number; title: string; description: string; image_url: string; categories: string[]; metacritic_score?: number; opencritic_score?: number; gameseed_score?: number; recommend_count?: number; average_rating?: number; };
type CriticReview = { id: number; outlet: string; author: string; rating: number; content: string; url: string; };

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [criticReviews, setCriticReviews] = useState<CriticReview[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userPlaytime, setUserPlaytime] = useState<number | null>(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [isRecommended, setIsRecommended] = useState(false);
  const [actionLoading, setActionLoading] = useState<"recommend" | null>(null);

  const [myReview, setMyReview] = useState("");
  const [myRating, setMyRating] = useState(80);
  
  // (임시 유지) 게임 정보 수정용 상태 
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", image_url: "", categories: "" });
  
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(80);
  const [loading, setLoading] = useState(true);
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const toggleReview = (key: string) => setExpandedReviews(prev => ({ ...prev, [key]: !prev[key] }));
  const [visibleSteamCount, setVisibleSteamCount] = useState(5);
  const [visibleCriticCount, setVisibleCriticCount] = useState(5);
  const [steamReviews, setSteamReviews] = useState<Review[]>([]); 
  const siteReviews = reviews;
  const [activeReviewTab, setActiveReviewTab] = useState<"gameseed" | "steam" | "critic">("gameseed");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: gameData } = await supabase.from("games").select("*").eq("id", gameId).maybeSingle();
      setGame(gameData || null);

      if (gameData) {
        setEditForm({
          title: gameData.title, description: gameData.description || "", image_url: gameData.image_url || "", categories: gameData.categories ? gameData.categories.join(", ") : "",
        });

        const savedGames = JSON.parse(localStorage.getItem("recentGames") || "[]");
        const newGame = { id: gameData.id, title: gameData.title, url: `/review/${gameData.id}` };
        const filteredGames = savedGames.filter((g: any) => g.id !== gameData.id);
        localStorage.setItem("recentGames", JSON.stringify([newGame, ...filteredGames].slice(0, 5)));
        window.dispatchEvent(new Event("recentGamesUpdated"));
      }

      const { data: reviewData } = await supabase.from("reviews").select("*").eq("game_id", gameId).order("created_at", { ascending: false });
      setReviews(reviewData || []);

      const { data: steamData } = await supabase.from("steam_reviews").select("*").eq("game_id", gameId).order("created_at", { ascending: false });
      setSteamReviews(steamData || []);

      const { data: criticData } = await supabase.from("critic_reviews").select("*").eq("game_id", gameId);
      setCriticReviews(criticData || []);

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: profileData } = await supabase.from("user_profiles").select("role").eq("id", session.user.id).maybeSingle();
        if (profileData && profileData.role === 'admin') setIsAdmin(true);

        if (gameData) {
          const { data: ownedGame } = await supabase.from("user_owned_games").select("playtime_forever").eq("user_id", session.user.id).ilike("game_title", `%${gameData.title}%`).maybeSingle();
          if (ownedGame) setUserPlaytime(ownedGame.playtime_forever);

          const { data: recommendData } = await supabase.from("game_recommends").select("id").eq("user_id", session.user.id).eq("game_id", gameData.id).maybeSingle();
          if (recommendData) setIsRecommended(true);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [gameId]);

  const refreshGameCounts = async () => {
    const { data: refreshedGame } = await supabase.from("games").select("*").eq("id", gameId).maybeSingle();
    if (refreshedGame) setGame(refreshedGame);
  };

  const handleToggleRecommend = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!game) return;

    try {
      setActionLoading("recommend");
      if (isRecommended) {
        const { error } = await supabase.from("game_recommends").delete().eq("game_id", game.id).eq("user_id", user.id);
        if (error) return alert("추천 취소 실패: " + error.message);
        
        await supabase.rpc("refresh_game_recommend_count", { target_game_id: game.id });
        setIsRecommended(false);
      } else {
        const { error } = await supabase.from("game_recommends").insert({ game_id: game.id, user_id: user.id });
        if (error) return alert("추천 실패: " + error.message);

        await supabase.rpc("refresh_game_recommend_count", { target_game_id: game.id });
        setIsRecommended(true);
      }
      await refreshGameCounts(); 
    } finally {
      setActionLoading(null);
    }
  };

  // (임시 유지) 게임 정보 업데이트 및 삭제 함수
  const handleUpdateGame = async () => {
    if (!confirm("게임 정보를 수정하시겠습니까?")) return;
    const categoryArray = editForm.categories.split(",").map((c) => c.trim()).filter(Boolean);
    const { error } = await supabase.from("games").update({ title: editForm.title, description: editForm.description, image_url: editForm.image_url, categories: categoryArray }).eq("id", gameId);
    if (error) alert("수정 실패: " + error.message); else window.location.reload();
  };

  const handleDeleteGame = async () => {
    if (!confirm("정말 이 게임을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("games").delete().eq("id", gameId);
    if (error) alert("삭제 실패: " + error.message); else { alert("삭제되었습니다."); router.push("/review"); }
  };

  const handleSubmitReview = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!myReview.trim()) return alert("내용을 입력해주세요.");
    const { error } = await supabase.from("reviews").insert({ game_id: gameId, content: myReview, rating: myRating, author: user.email, user_id: user.id, playtime: userPlaytime || 0, created_at: new Date().toISOString() });
    if (error) alert("등록 실패: " + error.message); else window.location.reload();
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await supabase.from("reviews").delete().eq("id", reviewId);
    window.location.reload();
  };

  const handleLikeReview = async (reviewId: number, currentLikes: number = 0) => {
    if (!user) return alert("로그인이 필요합니다.");
    const { error } = await supabase.from("reviews").update({ likes: currentLikes + 1 }).eq("id", reviewId);
    if (error) alert("추천 실패: " + error.message); else window.location.reload(); 
  };

  const startEditing = (review: Review) => { setEditingReviewId(review.id); setEditContent(review.content); setEditRating(review.rating); };
  const cancelEditing = () => { setEditingReviewId(null); setEditContent(""); };
  const saveEditedReview = async (reviewId: number) => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");
    const { error } = await supabase.from("reviews").update({ content: editContent, rating: editRating }).eq("id", reviewId);
    if (error) alert("수정 실패: " + error.message); else window.location.reload();
  };

  const getScoreStyle = (score: number) => {
    if (score >= 80) return "bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-emerald-200/50";
    if (score >= 50) return "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-orange-200/50";
    return "bg-gradient-to-br from-rose-400 to-red-600 text-white shadow-rose-200/50";
  };

  const getScoreTextColor = (score: number | undefined | null) => {
    if (!score || score === 0) return "text-muted-foreground"; 
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const cleanSteamContent = (text: string) => text.replace(/\[\/?h\d\]/g, "").replace(/\[\/?b\]/g, "").replace(/\[\/?i\]/g, "").replace(/\[\/?u\]/g, "").replace(/\[\/?quote\]/g, "");

  if (loading || !game) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-bold transition-colors">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-8">
        
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-primary mb-6 transition-colors w-fit">
          <Icons.ChevronLeft /> 목록으로
        </button>

        <section className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden mb-12 flex flex-col md:flex-row relative transition-colors">
          {/* ⭐ 게임 정보 수정 폼 (임시 주석 처리)
          {isEditing && isAdmin ? (
             <div className="p-8 w-full flex flex-col gap-4">
              <input type="text" value={editForm.image_url} onChange={(e) => setEditForm({...editForm, image_url: e.target.value})} className="p-3 border border-border rounded-xl bg-muted text-foreground" placeholder="이미지 URL" />
              <input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="text-2xl font-bold p-3 border border-border rounded-xl bg-muted text-foreground" placeholder="게임 제목" />
              <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="h-32 p-3 border border-border rounded-xl bg-muted text-foreground" placeholder="게임 설명" />
              <input value={editForm.categories} onChange={(e) => setEditForm({...editForm, categories: e.target.value})} className="p-3 border border-border rounded-xl bg-muted text-foreground" placeholder="태그 (쉼표로 구분)" />
              <div className="flex gap-2 mt-4">
                <button onClick={handleUpdateGame} className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:opacity-90 transition-all">저장</button>
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 bg-secondary text-secondary-foreground rounded-xl font-bold hover:bg-muted transition-all">취소</button>
              </div>
            </div>
          ) : (
          */}
            <>
              <div className="w-full md:w-[40%] h-72 md:h-auto relative bg-muted flex-shrink-0">
                {game.image_url ? (
                  <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">이미지 없음</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 md:from-transparent to-transparent"></div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-center relative z-10 -mt-20 md:mt-0 bg-card md:bg-transparent rounded-t-3xl md:rounded-none">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {game.categories?.map((c) => (
                    <span key={c} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold tracking-wider border border-primary/20">
                      {GAME_CATEGORIES.find(cat => cat.slug === c)?.name || c}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-start gap-4 mb-4">
                  <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">{game.title}</h1>
                  
                  <button 
                    onClick={handleToggleRecommend} 
                    disabled={actionLoading === "recommend"}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border transition-all active:scale-95 ${
                      isRecommended 
                        ? "bg-amber-50 border-amber-200 text-amber-500 dark:bg-amber-500/10 dark:border-amber-500/30" 
                        : "bg-card border-border text-muted-foreground hover:text-amber-500 hover:border-amber-300"
                    }`}
                    title={isRecommended ? "추천 취소" : "추천하기"}
                  >
                    {isRecommended ? <Icons.StarSolid /> : <Icons.StarOutline />}
                    <span className="text-sm font-bold">
                      {actionLoading === "recommend" ? "처리중" : `추천 ${game.recommend_count ?? 0}`}
                    </span>
                  </button>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed mb-8 line-clamp-4">{game.description}</p>
                
                <div className="flex items-center gap-5 mb-4">
                  <div className="flex flex-col pr-5 border-r border-border">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">GameSeed 평점</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-black ${getScoreTextColor(game.average_rating || game.gameseed_score)}`}>
                        {game.average_rating ? Number(game.average_rating).toFixed(1) : (game.gameseed_score && game.gameseed_score > 0 ? game.gameseed_score : "평가 없음")}
                      </span>
                      {(game.average_rating || game.gameseed_score) ? <span className="text-sm font-bold text-muted-foreground">/ 100</span> : null}
                    </div>
                  </div>

                  <div className="flex gap-5">
                    {game.opencritic_score && game.opencritic_score > 0 && (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">OpenCritic</span>
                        <span className={`text-lg font-black ${getScoreTextColor(game.opencritic_score)}`}>{game.opencritic_score}</span>
                      </div>
                    )}
                    {game.metacritic_score && game.metacritic_score > 0 && (
                      <div className={`flex flex-col ${game.opencritic_score && game.opencritic_score > 0 ? "pl-5 border-l border-border" : ""}`}>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Metacritic</span>
                        <span className={`text-lg font-black ${getScoreTextColor(game.metacritic_score)}`}>{game.metacritic_score}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ⭐ 게임 정보 수정 버튼 (임시 주석 처리)
                {isAdmin && (
                  <div className="absolute top-4 right-4 md:top-6 md:right-16 flex gap-2">
                    <button onClick={() => setIsEditing(true)} className="p-2 text-muted-foreground hover:text-primary transition-colors bg-card rounded-full shadow-sm hover:shadow-md border border-border" title="게임 정보 수정">
                      <Icons.Edit />
                    </button>
                  </div>
                )}
                */}
              </div>
            </>
          {/* ⭐ 게임 정보 수정 폼 닫기 (임시 주석 처리)
          )}
          */}
        </section>

        <section className="bg-card p-6 rounded-3xl border border-border shadow-sm relative overflow-hidden group transition-colors mb-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500"></div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-foreground">이 게임, 어떠셨나요?</h2>
            {userPlaytime !== null && userPlaytime > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#171a21]/10 dark:bg-[#1b2838]/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg border border-indigo-500/20">
                <Icons.Clock /> 스팀 플레이 {(userPlaytime / 60).toFixed(1)}시간 인증됨
              </div>
            )}
          </div>

          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-5 bg-muted/50 p-4 rounded-2xl border border-border transition-colors">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${getScoreStyle(myRating)}`}>
                  <span className="text-2xl font-black">{myRating}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                    <span>0점 (비추천)</span>
                    <span className="text-primary">점수를 조절해주세요</span>
                    <span>100점 (추천)</span>
                  </div>
                  <input type="range" min={0} max={100} value={myRating} onChange={(e) => setMyRating(Number(e.target.value))} className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>

              <textarea value={myReview} onChange={(e) => setMyReview(e.target.value)} className="w-full h-28 border border-border bg-muted/30 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all text-sm resize-none text-foreground placeholder:text-muted-foreground" placeholder="이 게임에 대한 솔직한 평가를 남겨주세요..." />
              
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-muted-foreground font-medium pl-2">
                  {userPlaytime !== null ? "* 작성 시 플레이 타임이 함께 등록됩니다." : "* 마이페이지에서 스팀을 연동하면 플레이 타임을 인증할 수 있습니다."}
                </span>
                <button onClick={handleSubmitReview} className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 active:scale-95 transition-all">
                  리뷰 등록하기
                </button>
              </div>
            </div>
          ) : (
            <div className="py-10 text-center flex flex-col items-center justify-center bg-muted/30 rounded-2xl border border-border">
              <p className="text-sm font-bold text-muted-foreground mb-3">리뷰를 작성하려면 로그인이 필요합니다.</p>
              <button onClick={() => router.push('/auth/login')} className="px-5 py-2 bg-card border border-border text-primary font-bold rounded-xl shadow-sm hover:bg-muted transition-colors">로그인하러 가기</button>
            </div>
          )}
        </section>

        <div className="border-b border-border mb-6 flex gap-6 px-2 overflow-x-auto scrollbar-hide">
          <button onClick={() => setActiveReviewTab("gameseed")} className={`pb-3 text-sm font-extrabold whitespace-nowrap transition-colors relative ${activeReviewTab === "gameseed" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            GameSeed 유저 평론
            <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{siteReviews.length}</span>
            {activeReviewTab === "gameseed" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-md"></div>}
          </button>
          <button onClick={() => setActiveReviewTab("steam")} className={`pb-3 text-sm font-extrabold whitespace-nowrap transition-colors relative flex items-center gap-1 ${activeReviewTab === "steam" ? "text-[#1b2838] dark:text-[#66c0f4]" : "text-muted-foreground hover:text-foreground"}`}>
            외부(Steam) 평론
            <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{steamReviews.length}</span>
            {activeReviewTab === "steam" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1b2838] dark:bg-[#66c0f4] rounded-t-md"></div>}
          </button>
          {criticReviews.length > 0 && (
            <button onClick={() => setActiveReviewTab("critic")} className={`pb-3 text-sm font-extrabold whitespace-nowrap transition-colors relative ${activeReviewTab === "critic" ? "text-amber-500" : "text-muted-foreground hover:text-foreground"}`}>
              전문가 평론
              <span className="ml-1.5 text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{criticReviews.length}</span>
              {activeReviewTab === "critic" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-md"></div>}
            </button>
          )}
        </div>

        <div className="min-h-[400px]">
          {activeReviewTab === "gameseed" && (
            <div className="space-y-4 animate-fade-in">
              {siteReviews.length > 0 ? siteReviews.map((r) => (
                <div key={r.id} className="bg-card p-5 rounded-3xl border border-border shadow-sm hover:shadow-md transition-all">
                  {editingReviewId === r.id ? (
                    <div className="animate-fade-in">
                      <div className="flex items-center gap-4 mb-3">
                        <input type="number" min={0} max={100} value={editRating} onChange={(e) => setEditRating(Number(e.target.value))} className="w-20 border border-border bg-muted p-2 rounded-xl text-center font-bold text-foreground" />
                        <input type="range" min={0} max={100} value={editRating} onChange={(e) => setEditRating(Number(e.target.value))} className="flex-1 accent-primary" />
                      </div>
                      <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-24 border border-border bg-muted p-3 rounded-xl mb-3 focus:ring-2 focus:ring-primary/20 outline-none text-sm text-foreground" />
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelEditing} className="px-4 py-2 bg-secondary text-secondary-foreground font-bold rounded-xl hover:bg-muted transition-colors">취소</button>
                        <button onClick={() => saveEditedReview(r.id)} className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-sm hover:opacity-90">수정 완료</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform hover:rotate-3 ${getScoreStyle(r.rating)}`}>
                        <span className="text-lg font-black">{r.rating}</span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span 
                                onClick={() => { if (r.user_id) router.push(`/user/${r.user_id}`); }} 
                                className="font-extrabold text-sm text-foreground hover:text-indigo-600 cursor-pointer transition-colors"
                              >
                                {r.author?.split("@")[0] ?? "익명"}
                              </span>
                              {r.playtime !== undefined && r.playtime > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[10px] font-bold rounded-md border border-indigo-500/20">
                                  <Icons.Clock /> {(r.playtime / 60).toFixed(1)}시간
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-medium text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleDateString()}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleLikeReview(r.id, r.likes)} className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors"><Icons.HeartOutline /> {r.likes || 0}</button>
                            {user && user.id === r.user_id && (
                              <div className="flex gap-2 pl-3 border-l border-border">
                                <button onClick={() => startEditing(r)} className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors">수정</button>
                                <button onClick={() => handleDeleteReview(r.id)} className="text-[11px] font-bold text-muted-foreground hover:text-destructive transition-colors">삭제</button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-wrap">{r.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              )) : <div className="p-10 text-center border border-dashed border-border rounded-3xl text-muted-foreground text-sm font-bold bg-card transition-colors">가장 먼저 리뷰를 남겨보세요!</div>}
            </div>
          )}

          {activeReviewTab === "steam" && (
            <div className="space-y-4 animate-fade-in">
              {steamReviews.length > 0 ? (
                <>
                  {steamReviews.slice(0, visibleSteamCount).map((r) => {
                    const content = cleanSteamContent(r.content);
                    const isLong = content.length > 150; 
                    const isExpanded = expandedReviews[`steam_${r.id}`];
                    return (
                      <div key={r.id} className="bg-card p-5 rounded-3xl border border-border shadow-sm flex gap-4 group transition-all">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${getScoreStyle(r.rating)}`}><span className="text-sm font-black">{r.rating}</span></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1.5">
                            <span className="text-sm font-bold text-foreground truncate">{r.author}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className={`text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap transition-all ${!isExpanded && isLong ? "line-clamp-4" : ""}`}>{content}</p>
                          {isLong && <button onClick={() => toggleReview(`steam_${r.id}`)} className="text-xs font-bold text-blue-500 hover:underline mt-1.5 transition-colors">{isExpanded ? "접기 ▲" : "텍스트 더보기 ▼"}</button>}
                        </div>
                      </div>
                    );
                  })}
                  {steamReviews.length > visibleSteamCount && <button onClick={() => setVisibleSteamCount(prev => prev + 5)} className="w-full py-3 mt-4 bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-sm font-bold rounded-2xl transition-colors border border-border">스팀 리뷰 더보기 ({visibleSteamCount} / {steamReviews.length}) ▼</button>}
                </>
              ) : <div className="p-10 text-center border border-dashed border-border rounded-3xl text-muted-foreground text-sm font-bold bg-card transition-colors">스팀 평론이 없습니다.</div>}
            </div>
          )}

          {activeReviewTab === "critic" && (
            <div className="space-y-4 animate-fade-in">
              {criticReviews.slice(0, visibleCriticCount).map((cr) => {
                const isLong = cr.content.length > 120;
                const isExpanded = expandedReviews[`critic_${cr.id}`];
                return (
                  <div key={cr.id} className="bg-amber-50 dark:bg-amber-500/10 p-5 rounded-3xl border border-amber-200 dark:border-amber-500/20 shadow-sm block group transition-colors">
                    <div className="flex justify-between items-center mb-3">
                      <a href={cr.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-amber-700 dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 hover:underline transition-colors">
                        {cr.outlet}
                      </a>
                      <span className="text-sm font-black bg-amber-500 px-3 py-1 rounded-lg text-white shadow-sm">
                        {cr.rating}
                      </span>
                    </div>
                    <p className={`text-sm text-foreground/80 mb-2 leading-relaxed whitespace-pre-wrap transition-all ${!isExpanded && isLong ? "line-clamp-4" : ""}`}>
                      {cr.content}
                    </p>
                    {isLong && (
                      <button onClick={() => toggleReview(`critic_${cr.id}`)} className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:opacity-80 mb-2 transition-opacity">
                        {isExpanded ? "접기 ▲" : "텍스트 더보기 ▼"}
                      </button>
                    )}
                    <div className="text-xs text-muted-foreground font-medium">by {cr.author}</div>
                  </div>
                );
              })}
              
              {criticReviews.length > visibleCriticCount && (
                <button 
                  onClick={() => setVisibleCriticCount(prev => prev + 5)} 
                  className="w-full py-3 mt-4 bg-amber-100/50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-sm font-bold rounded-2xl transition-colors border border-amber-200 dark:border-amber-500/20"
                >
                  전문가 평론 더보기 ({visibleCriticCount} / {criticReviews.length}) ▼
                </button>
              )}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { GAME_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

// 타입 정의
type Review = {
  id: number;
  content: string;
  rating: number;
  author: string;
  user_id: string | null;
  created_at: string;
  game_id?: number;
};

type Game = {
  id: number;
  title: string;
  description: string;
  image_url: string;
  categories: string[];
  metacritic_score?: number;
  opencritic_score?: number;
};

type CriticReview = {
  id: number;
  outlet: string;
  author: string;
  rating: number;
  content: string;
  url: string;
};

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  // 상태 관리
  const [game, setGame] = useState<Game | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [criticReviews, setCriticReviews] = useState<CriticReview[]>([]);
  const [user, setUser] = useState<any>(null);

  // 내 리뷰 작성용 (기본값 80점)
  const [myReview, setMyReview] = useState("");
  const [myRating, setMyRating] = useState(80);

  // 게임 정보 수정용
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", image_url: "", categories: "" });

  // 리뷰 수정용
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(80);

  // UI state
  const [loading, setLoading] = useState(true);

  // 분리된 리뷰
  const steamReviews = reviews.filter((r) => !r.user_id || r.author?.startsWith("SteamUser_"));
  const siteReviews = reviews.filter((r) => r.user_id);

  // 데이터 로딩
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 1. 게임 정보
      const { data: gameData, error: gameError } = await supabase.from("games").select("*").eq("id", gameId).single();
      if (gameError) console.error("게임 로드 실패:", gameError);
      setGame(gameData || null);

      if (gameData) {
        setEditForm({
          title: gameData.title,
          description: gameData.description || "",
          image_url: gameData.image_url || "",
          categories: gameData.categories ? gameData.categories.join(", ") : "",
        });
      }

      // 2. 리뷰 목록
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });

      if (reviewError) console.error("리뷰 로드 실패:", reviewError);
      setReviews(reviewData || []);

      // 3. 전문가 평론
      const { data: criticData, error: criticError } = await supabase
        .from("critic_reviews")
        .select("*")
        .eq("game_id", gameId);
      if (criticError) console.error("전문가 평론 로드 실패:", criticError);
      setCriticReviews(criticData || []);

      // 4. 유저 세션
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      setLoading(false);
    };

    fetchData();
  }, [gameId]);

  // --- 핸들러 함수들 ---

  const handleUpdateGame = async () => {
    if (!confirm("게임 정보를 수정하시겠습니까?")) return;
    const categoryArray = editForm.categories.split(",").map((c) => c.trim()).filter((c) => c !== "");

    const { error } = await supabase
      .from("games")
      .update({
        title: editForm.title,
        description: editForm.description,
        image_url: editForm.image_url,
        categories: categoryArray,
      })
      .eq("id", gameId);

    if (error) alert("수정 실패: " + error.message);
    else window.location.reload();
  };

  const handleDeleteGame = async () => {
    if (!confirm("정말 이 게임을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("games").delete().eq("id", gameId);
    if (error) alert("삭제 실패: " + error.message);
    else { alert("삭제되었습니다."); router.push("/review"); }
  };

  const handleSubmitReview = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!myReview.trim()) return alert("내용을 입력해주세요.");

    const { error } = await supabase.from("reviews").insert({
      game_id: gameId,
      content: myReview,
      rating: myRating,
      author: user.email,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });

    if (error) alert("등록 실패: " + error.message);
    else window.location.reload();
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await supabase.from("reviews").delete().eq("id", reviewId);
    window.location.reload();
  };

  const startEditing = (review: Review) => {
    setEditingReviewId(review.id);
    setEditContent(review.content);
    setEditRating(review.rating);
  };

  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditContent("");
  };

  const saveEditedReview = async (reviewId: number) => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");
    const { error } = await supabase
      .from("reviews")
      .update({ content: editContent, rating: editRating })
      .eq("id", reviewId);

    if (error) alert("수정 실패: " + error.message);
    else window.location.reload();
  };

  // 점수 색
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "border-green-500 text-green-600 bg-green-50";
    if (score >= 50) return "border-yellow-400 text-yellow-600 bg-yellow-50";
    return "border-red-400 text-red-600 bg-red-50";
  };

  const cleanSteamContent = (text: string) =>
    text
      .replace(/\[\/?h\d\]/g, "")      
      .replace(/\[\/?b\]/g, "")        
      .replace(/\[\/?i\]/g, "")        
      .replace(/\[\/?u\]/g, "")        
      .replace(/\[\/?quote\]/g, "");   

  if (loading || !game) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 text-gray-900">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <button onClick={() => router.push("/")} className="text-2xl font-extrabold text-indigo-600 hover:text-indigo-700">GameSeed</button>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <button onClick={() => router.push("/community")} className="text-gray-700 hover:text-indigo-600">커뮤니티</button>
            <button onClick={() => router.push("/review")} className="text-indigo-700 font-semibold">평론</button>
            <button onClick={() => router.push("/recommend")} className="text-gray-700 hover:text-indigo-600">AI 추천</button>
            <button onClick={() => router.push("/news")} className="text-gray-700 hover:text-indigo-600">뉴스</button>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600 truncate max-w-[12rem]">{user.email}</span>
                <button onClick={async () => { await supabase.auth.signOut(); router.refresh(); }} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm">로그아웃</button>
              </>
            ) : (
              <>
                <button onClick={() => router.push("/auth")} className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50">로그인</button>
                <button onClick={() => router.push("/auth?mode=signup")} className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">회원가입</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* 상단 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-orange-600 text-sm">← 목록으로 돌아가기</button>

          {user && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button onClick={handleUpdateGame} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">저장</button>
                  <button onClick={() => setIsEditing(false)} className="bg-gray-400 text-white px-3 py-1 rounded text-xs font-bold">취소</button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-gray-600 text-xs">관리자 수정</button>
              )}
            </div>
          )}
        </div>

        {/* ------------------------------ */}
        {/*        게임 정보 카드          */}
        {/* ------------------------------ */}
        <section className="bg-white rounded-xl border border-indigo-100 shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3 h-64 rounded-lg bg-gray-100 overflow-hidden">
              {isEditing ? (
                <input type="text" value={editForm.image_url} onChange={(e) => setEditForm({...editForm, image_url: e.target.value})} className="w-full h-full p-2" placeholder="이미지 URL" />
              ) : game.image_url ? (
                <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">이미지 없음</div>
              )}
            </div>

            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full text-2xl font-bold border p-2 rounded" />
                  <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full h-32 border p-2 rounded" />
                  <input value={editForm.categories} onChange={(e) => setEditForm({...editForm, categories: e.target.value})} className="w-full border p-2 rounded" placeholder="tag1, tag2" />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-extrabold mb-3">{game.title}</h1>
                  <p className="text-gray-600 mb-4 leading-relaxed">{game.description}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {game.categories?.map((c) => (
                      <span key={c} className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-600 border border-gray-200">
                        {GAME_CATEGORIES.find(cat => cat.slug === c)?.name || c}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    {game.opencritic_score && <div className="px-3 py-2 bg-gray-50 border rounded">OpenCritic: <strong className="ml-2">{game.opencritic_score}</strong></div>}
                    {game.metacritic_score && <div className="px-3 py-2 bg-gray-50 border rounded">Metacritic: <strong className="ml-2">{game.metacritic_score}</strong></div>}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------ */}
        {/*        전문가 평론              */}
        {/* ------------------------------ */}
        {criticReviews.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4">✒️ 전문가 평론</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {criticReviews.map((cr) => (
                <a key={cr.id} href={cr.url} target="_blank" rel="noreferrer" className="block p-4 bg-white border rounded-lg shadow-sm hover:shadow">
                  <div className="flex justify-between items-center mb-2">
                    <strong>{cr.outlet}</strong>
                    <span className="text-sm text-gray-500">{cr.rating}점</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{cr.content}</p>
                  <div className="text-xs text-gray-400 mt-2">by {cr.author}</div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================= */}
        {/*   🔥🔥 사이트 유저 리뷰 작성 + 사이트 리뷰 목록 (위로 이동!) 🔥🔥 */}
        {/* ============================================================= */}
        <section className="mb-12">
          <h2 className="text-xl font-bold mb-4">유저 리뷰</h2>

          {/* 리뷰 작성 */}
          <div className="mb-6 bg-white p-6 rounded-xl border shadow-sm">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`min-w-[56px] h-14 rounded-xl border-2 flex items-center justify-center ${getScoreColorClass(myRating)}`}>
                    <span className="text-xl font-extrabold">{myRating}</span>
                  </div>
                  <div className="flex-1">
                    <input type="range" min={0} max={100} value={myRating} onChange={(e) => setMyRating(Number(e.target.value))} className="w-full" />
                    <div className="text-sm text-gray-500">슬라이더로 점수를 조절하세요</div>
                  </div>
                </div>

                <textarea value={myReview} onChange={(e) => setMyReview(e.target.value)} className="w-full h-28 border p-3 rounded-lg" placeholder="리뷰 내용을 입력하세요..." />
                <div className="flex justify-end">
                  <button onClick={handleSubmitReview} className="px-5 py-2 bg-orange-600 text-white rounded-lg">등록하기</button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">리뷰를 작성하려면 <button onClick={() => router.push('/auth')} className="text-orange-600 font-semibold">로그인</button>이 필요합니다.</div>
            )}
          </div>

          {/* 사이트 리뷰 목록 */}
          <div className="space-y-4">
            {siteReviews.map((r) => (
              <div key={r.id} className="bg-white p-4 rounded-xl border shadow-sm">
                {editingReviewId === r.id ? (
                  <div>
                    <div className="flex items-center gap-4 mb-3">
                      <input type="number" min={0} max={100} value={editRating} onChange={(e) => setEditRating(Number(e.target.value))} className="w-20 border p-2 rounded" />
                      <input type="range" min={0} max={100} value={editRating} onChange={(e) => setEditRating(Number(e.target.value))} className="flex-1" />
                    </div>
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full h-24 border p-2 rounded mb-3" />
                    <div className="flex justify-end gap-2">
                      <button onClick={cancelEditing} className="px-3 py-1 bg-gray-200 rounded">취소</button>
                      <button onClick={() => saveEditedReview(r.id)} className="px-3 py-1 bg-blue-600 text-white rounded">수정</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className={`min-w-[56px] h-14 rounded-xl border-2 flex items-center justify-center ${getScoreColorClass(r.rating)}`}>
                      <span className="text-xl font-extrabold">{r.rating}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold">{r.author?.split("@")[0] ?? "익명"}</div>
                          <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                        {user && user.id === r.user_id && (
                          <div className="flex gap-2">
                            <button onClick={() => startEditing(r)} className="text-sm text-blue-500">수정</button>
                            <button onClick={() => handleDeleteReview(r.id)} className="text-sm text-red-500">삭제</button>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{r.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ============================ */}
        {/*    🔽 스팀 리뷰 (맨 아래) 🔽 */}
        {/* ============================ */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">🕹️ 외부(스팀) 유저 평론</h2>
          {steamReviews.length === 0 ? (
            <div className="text-gray-500">스팀 유저 평론이 없습니다.</div>
          ) : (
            <div className="space-y-4">
              {steamReviews.map((r) => (
                <div key={r.id} className="bg-white p-4 rounded-xl border shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className={`min-w-[56px] h-14 rounded-xl border-2 flex items-center justify-center ${getScoreColorClass(r.rating)}`}>
                      <span className="text-xl font-extrabold">{r.rating}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold">{r.author}</div>
                          <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {cleanSteamContent(r.content)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

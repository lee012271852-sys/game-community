"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { GAME_CATEGORIES } from "@/lib/constants";

// 타입 정의
type Review = {
  id: number;
  content: string;
  rating: number;
  author: string;
  user_id: string;
  created_at: string;
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

  // 내 리뷰 작성용
  const [myReview, setMyReview] = useState("");
  const [myRating, setMyRating] = useState(5);

  // 게임 정보 수정용
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", image_url: "", categories: "" });

  // 리뷰 수정용
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editRating, setEditRating] = useState(5);

  // 데이터 로딩
  useEffect(() => {
    const fetchData = async () => {
      // 1. 게임 정보
      const { data: gameData } = await supabase.from("games").select("*").eq("id", gameId).single();
      setGame(gameData);

      if (gameData) {
        setEditForm({
          title: gameData.title,
          description: gameData.description || "",
          image_url: gameData.image_url || "",
          categories: gameData.categories ? gameData.categories.join(", ") : "",
        });
      }

      // 2. 유저 리뷰 목록
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false });
      setReviews(reviewData || []);

      // 3. 전문가 평론 목록
      const { data: criticData } = await supabase
        .from("critic_reviews")
        .select("*")
        .eq("game_id", gameId);
      setCriticReviews(criticData || []);

      // 4. 유저 세션
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    fetchData();
  }, [gameId]);

  // --- 핸들러 함수들 ---

  // 게임 정보 수정
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

  // 게임 삭제
  const handleDeleteGame = async () => {
    if (!confirm("정말 이 게임을 삭제하시겠습니까? (되돌릴 수 없습니다)")) return;
    const { error } = await supabase.from("games").delete().eq("id", gameId);
    if (error) alert("삭제 실패: " + error.message);
    else { alert("삭제되었습니다."); router.push("/review"); }
  };

  // 리뷰 등록
  const handleSubmitReview = async () => {
    if (!user) return alert("로그인이 필요합니다.");
    if (!myReview.trim()) return alert("내용을 입력해주세요.");

    const { error } = await supabase.from("reviews").insert({
      game_id: gameId,
      content: myReview,
      rating: myRating,
      author: user.email,
      user_id: user.id
    });

    if (error) alert("등록 실패: " + error.message);
    else window.location.reload();
  };

  // 리뷰 삭제
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await supabase.from("reviews").delete().eq("id", reviewId);
    window.location.reload();
  };

  // 리뷰 수정 시작
  const startEditing = (review: Review) => {
    setEditingReviewId(review.id);
    setEditContent(review.content);
    setEditRating(review.rating);
  };

  // 리뷰 수정 취소
  const cancelEditing = () => {
    setEditingReviewId(null);
    setEditContent("");
  };

  // 리뷰 수정 저장
  const saveEditedReview = async (reviewId: number) => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");
    const { error } = await supabase
      .from("reviews")
      .update({ content: editContent, rating: editRating })
      .eq("id", reviewId);

    if (error) alert("수정 실패: " + error.message);
    else window.location.reload();
  };

  if (!game) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-10">
        
        {/* 관리자 컨트롤 패널 */}
        {user && (
          <div className="flex justify-end gap-2 mb-4">
            {isEditing ? (
              <>
                <button onClick={handleUpdateGame} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold">저장</button>
                <button onClick={() => setIsEditing(false)} className="bg-gray-400 text-white px-4 py-2 rounded text-sm font-bold">취소</button>
              </>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(true)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs hover:bg-gray-200">✏️ 게임 수정</button>
                <button onClick={handleDeleteGame} className="bg-red-50 text-red-500 px-3 py-1.5 rounded text-xs hover:bg-red-100">🗑️ 게임 삭제</button>
              </div>
            )}
          </div>
        )}

        {/* 게임 정보 섹션 */}
        <div className="flex flex-col md:flex-row gap-8 mb-12 border-b pb-10">
          <div className="w-full md:w-1/3 h-64 bg-gray-100 rounded-xl overflow-hidden shadow-md flex items-center justify-center">
            {isEditing ? (
               <input type="text" value={editForm.image_url} onChange={(e) => setEditForm({...editForm, image_url: e.target.value})} className="w-full m-4 border p-2 rounded" placeholder="이미지 URL" />
            ) : (
              game.image_url ? <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" /> : <span className="text-gray-400">이미지 없음</span>
            )}
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full text-2xl font-bold border p-2 rounded" placeholder="게임 제목" />
                <textarea value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full h-32 border p-2 rounded" placeholder="게임 설명" />
                <input type="text" value={editForm.categories} onChange={(e) => setEditForm({...editForm, categories: e.target.value})} className="w-full border p-2 rounded" placeholder="태그 (쉼표로 구분)" />
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-extrabold mb-4">{game.title}</h1>
                
                {/* 점수 뱃지 */}
                <div className="flex gap-3 mb-6">
                  {game.opencritic_score && game.opencritic_score > 0 && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OpenCritic</span>
                        <span className={`text-2xl font-black ${game.opencritic_score >= 84 ? "text-blue-600" : game.opencritic_score >= 75 ? "text-green-600" : "text-yellow-600"}`}>
                          {game.opencritic_score}
                        </span>
                      </div>
                    </div>
                  )}
                  {game.metacritic_score && game.metacritic_score > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Metacritic</span>
                      <span className={`text-xl font-black ${game.metacritic_score >= 80 ? "text-green-600" : game.metacritic_score >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                        {game.metacritic_score}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-gray-600 text-lg leading-relaxed mb-4">{game.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {game.categories?.map((c: string) => (
                    <span key={c} className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600 border border-gray-200">
                      {GAME_CATEGORIES.find(cat => cat.slug === c)?.name || c}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 전문가 평론 섹션 */}
        {criticReviews.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">✒️ 전문가 평론 <span className="text-sm font-normal text-gray-500">(OpenCritic)</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {criticReviews.map((cr) => (
                <a key={cr.id} href={cr.url} target="_blank" rel="noopener noreferrer" className="block p-5 rounded-xl border border-gray-200 bg-gray-50 hover:border-gray-300 hover:shadow-sm transition">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-gray-900">{cr.outlet}</span>
                    {cr.rating && <span className="text-sm font-bold px-2 py-0.5 bg-gray-200 rounded">{cr.rating}점</span>}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-2">"{cr.content}"</p>
                  <span className="text-xs text-gray-400">by {cr.author}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 유저 리뷰 작성 */}
        <div className="mb-12 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <h3 className="text-lg font-bold mb-4">이 게임을 평가해주세요</h3>
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-yellow-500 text-xl">★</span>
                <input type="number" min="1" max="5" step="0.5" value={myRating} onChange={(e) => setMyRating(Number(e.target.value))} className="border p-1 rounded w-16 text-center"/>
                <span className="text-sm text-gray-500">/ 5.0</span>
              </div>
              <textarea className="w-full border p-3 rounded-lg h-24 resize-none bg-white" placeholder="감상평..." value={myReview} onChange={(e) => setMyReview(e.target.value)} />
              <div className="flex justify-end"><button onClick={handleSubmitReview} className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold">등록하기</button></div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">리뷰를 작성하려면 <span className="text-orange-600 font-bold cursor-pointer" onClick={() => router.push("/auth")}>로그인</span>이 필요합니다.</div>
          )}
        </div>

        {/* 유저 리뷰 목록 (수정 기능 포함) */}
        <div>
          <h3 className="text-xl font-bold mb-6">유저 리뷰 ({reviews.length})</h3>
          <div className="space-y-6">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-gray-100 pb-6 last:border-0">
                {editingReviewId === r.id ? (
                  <div className="bg-white p-4 border-2 border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold">별점 수정:</span>
                      <input type="number" min="1" max="5" step="0.5" value={editRating} onChange={(e) => setEditRating(Number(e.target.value))} className="border p-1 rounded w-16 text-center"/>
                    </div>
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full border p-2 rounded h-20 resize-none mb-2"/>
                    <div className="flex justify-end gap-2">
                      <button onClick={cancelEditing} className="px-3 py-1 bg-gray-300 rounded text-sm">취소</button>
                      <button onClick={() => saveEditedReview(r.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">저장 완료</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{r.author?.split("@")[0] || "익명"}</span>
                        <span className="text-yellow-500 font-bold">★ {r.rating}</span>
                      </div>
                      {user && user.id === r.user_id && (
                        <div className="flex gap-2">
                          <button onClick={() => startEditing(r)} className="text-xs text-blue-500 hover:underline">수정</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleDeleteReview(r.id)} className="text-xs text-red-500 hover:underline">삭제</button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{r.content}</p>
                    <div className="text-xs text-gray-400 mt-2">{new Date(r.created_at).toLocaleDateString()}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
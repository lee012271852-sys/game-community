"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;

  const [game, setGame] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  // 내 리뷰 작성용 State
  const [myReview, setMyReview] = useState("");
  const [myRating, setMyRating] = useState(5);

  // ★ 리뷰 수정용 State (추가됨)
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null); // 지금 수정 중인 리뷰 ID
  const [editContent, setEditContent] = useState(""); // 수정할 내용
  const [editRating, setEditRating] = useState(5);    // 수정할 별점

  // 데이터 불러오기 (기존과 동일)
  useEffect(() => {
    const fetchData = async () => {
      const { data: gameData } = await supabase.from("games").select("*").eq("id", gameId).single();
      setGame(gameData);

      const { data: reviewData } = await supabase.from("reviews").select("*").eq("game_id", gameId).order("created_at", { ascending: false });
      setReviews(reviewData || []);

      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    fetchData();
  }, [gameId]);

  // 리뷰 등록 핸들러 (기존과 동일)
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

  // 리뷰 삭제 핸들러 (기존과 동일)
  const handleDelete = async (reviewId: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    await supabase.from("reviews").delete().eq("id", reviewId);
    window.location.reload();
  };

  // ★ 수정 모드 시작 함수
  const startEditing = (review: any) => {
    setEditingReviewId(review.id); // "나 이 리뷰 수정할래"
    setEditContent(review.content); // 기존 내용 불러오기
    setEditRating(review.rating);   // 기존 별점 불러오기
  };

  // ★ 수정 취소 함수
  const cancelEditing = () => {
    setEditingReviewId(null); // 수정 모드 끄기
    setEditContent("");
  };

  // ★ 수정 내용 저장 함수 (UPDATE)
  const saveEditedReview = async (reviewId: number) => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");

    const { error } = await supabase
      .from("reviews")
      .update({
        content: editContent,
        rating: editRating
      })
      .eq("id", reviewId); // 해당 리뷰 ID만 업데이트

    if (error) {
      alert("수정 실패: " + error.message);
    } else {
      alert("수정되었습니다.");
      setEditingReviewId(null);
      window.location.reload(); // 새로고침해서 반영
    }
  };

  if (!game) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-10">
        
        {/* 게임 정보 (기존과 동일) */}
        <div className="flex flex-col md:flex-row gap-8 mb-12 border-b pb-10">
          <div className="w-full md:w-1/3 h-64 bg-gray-100 rounded-xl overflow-hidden shadow-md">
            {game.image_url && <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" />}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold mb-4">{game.title}</h1>
            <p className="text-gray-600 text-lg leading-relaxed">{game.description}</p>
          </div>
        </div>

        {/* 새 리뷰 작성 (기존과 동일) */}
        <div className="mb-12 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <h3 className="text-lg font-bold mb-4">이 게임을 평가해주세요</h3>
          {/* ... (작성 폼 UI 생략, 기존 코드 사용) ... */}
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-yellow-500 text-xl">★</span>
                <input type="number" min="1" max="5" step="0.5" value={myRating} onChange={(e) => setMyRating(Number(e.target.value))} className="border p-1 rounded w-16 text-center"/>
              </div>
              <textarea className="w-full border p-3 rounded-lg h-24 resize-none bg-white" placeholder="감상평..." value={myReview} onChange={(e) => setMyReview(e.target.value)} />
              <div className="flex justify-end"><button onClick={handleSubmitReview} className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold">등록하기</button></div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">로그인이 필요합니다.</div>
          )}
        </div>

        {/* ★ 리뷰 목록 (여기가 핵심 변경됨) */}
        <div>
          <h3 className="text-xl font-bold mb-6">유저 리뷰 ({reviews.length})</h3>
          <div className="space-y-6">
            {reviews.map((r) => (
              <div key={r.id} className="border-b border-gray-100 pb-6 last:border-0">
                
                {/* 1. 만약 이 리뷰가 '수정 중'이라면? -> 입력폼 보여주기 */}
                {editingReviewId === r.id ? (
                  <div className="bg-white p-4 border-2 border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold">별점 수정:</span>
                      <input 
                        type="number" min="1" max="5" step="0.5" 
                        value={editRating} 
                        onChange={(e) => setEditRating(Number(e.target.value))}
                        className="border p-1 rounded w-16 text-center"
                      />
                    </div>
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full border p-2 rounded h-20 resize-none mb-2"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={cancelEditing} className="px-3 py-1 bg-gray-300 rounded text-sm">취소</button>
                      <button onClick={() => saveEditedReview(r.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">저장 완료</button>
                    </div>
                  </div>
                ) : (
                  // 2. 수정 중이 아니라면? -> 그냥 내용 보여주기
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{r.author?.split("@")[0] || "익명"}</span>
                        <span className="text-yellow-500 font-bold">★ {r.rating}</span>
                      </div>
                      
                      {/* 내 글일 때만 수정/삭제 버튼 노출 */}
                      {user && user.id === r.user_id && (
                        <div className="flex gap-2">
                          <button onClick={() => startEditing(r)} className="text-xs text-blue-500 hover:underline">수정</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:underline">삭제</button>
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
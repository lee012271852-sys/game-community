"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";

interface CommentFormProps {
  postId: number;
  userId: string | null; // 로그인 유저 ID
  onCommentAdded: () => void; // 댓글 작성 후 리스트 갱신
}

export default function CommentForm({
  postId,
  userId,
  onCommentAdded,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const submitComment = async () => {
    if (!userId) {
      alert("댓글을 작성하려면 로그인해야 합니다.");
      return;
    }

    if (!content.trim()) {
      alert("댓글 내용을 입력해주세요.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: userId,   // DB에는 로그인 유저 ID 저장
      nickname: "익명",  // 화면에는 익명 표시
      content,
      created_at: new Date().toISOString(),
    });

    setLoading(false);

    if (!error) {
      setContent("");
      onCommentAdded();
    } else {
      console.error("댓글 등록 오류:", JSON.stringify(error, null, 2));
      alert("댓글 등록에 실패했습니다. 콘솔을 확인하세요.");
    }
  };

  return (
    <div className="space-y-2 mt-6">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 입력하세요"
        className="w-full p-3 border rounded-lg bg-white text-gray-900"
      />
      <button
        onClick={submitComment}
        disabled={loading}
        className={`px-4 py-2 rounded-lg text-white ${
          loading ? "bg-gray-400" : "bg-blue-600"
        }`}
      >
        {loading ? "등록 중..." : "댓글 등록"}
      </button>
    </div>
  );
}

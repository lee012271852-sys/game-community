"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  nickname?: string;
  content: string;
  created_at: string;
}

interface CommentListProps {
  comments: Comment[];
  currentUserId: string | null;
  onCommentUpdated: () => void;
}

export default function CommentList({
  comments,
  currentUserId,
  onCommentUpdated,
}: CommentListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const startEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditContent(c.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const submitEdit = async (id: number) => {
    const { error } = await supabase
      .from("comments")
      .update({ content: editContent })
      .eq("id", id);
    if (!error) onCommentUpdated();
    cancelEdit();
  };

  const deleteComment = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) onCommentUpdated();
  };

  if (comments.length === 0)
    return <p className="text-gray-500 mt-4">댓글이 없습니다.</p>;

  return (
    <ul className="space-y-3 mt-4">
      {comments.map((c) => (
        <li
          key={c.id}
          className="border border-gray-300 p-3 rounded-md bg-gray-100 shadow-sm"
        >
          <div className="flex justify-between text-sm text-gray-700 mb-1">
            <span className="font-medium">{c.nickname || c.user_id}</span>
            <span className="text-gray-500">
              {new Date(c.created_at).toLocaleString()}
            </span>
          </div>

          {editingId === c.id ? (
            <div className="space-y-2">
              <textarea
                className="w-full border p-2 rounded text-gray-900"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => submitEdit(c.id)}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  저장
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-2 py-1 bg-gray-400 text-white rounded text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-gray-800">{c.content}</div>
              {/* 댓글 작성자일 경우만 수정/삭제 버튼 표시 */}
              {currentUserId === c.user_id && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => startEdit(c)}
                    className="px-2 py-1 bg-yellow-400 text-white rounded text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

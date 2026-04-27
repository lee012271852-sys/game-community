"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient"; 
import CommentForm from "./CommentForm";

const Icons = {
  CornerDownRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 4v11a2 2 0 002 2h10" /></svg>,
  Alert: () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  nickname?: string;
  content: string;
  created_at: string;
  parent_id?: number | null;
}

interface CommentListProps {
  comments: Comment[];
  currentUserId: string | null;
  onCommentUpdated: () => void;
  postId: number;
  onReport: (type: 'post' | 'comment', id: number | string, author: string, content: string) => void;
}

function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return past.toLocaleDateString();
}

export default function CommentList({
  comments,
  currentUserId,
  onCommentUpdated,
  postId,
  onReport, 
}: CommentListProps) {
  const router = useRouter(); 
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingId, setReplyingId] = useState<number | null>(null);

  const parentComments = comments.filter((c) => !c.parent_id);
  const childComments = comments.filter((c) => c.parent_id);

  const startEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditContent(c.content);
    setReplyingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const submitEdit = async (id: number) => {
    if (!editContent.trim()) return alert("내용을 입력해주세요.");
    const { error } = await supabase.from("comments").update({ content: editContent }).eq("id", id);
    if (!error) onCommentUpdated();
    cancelEdit();
  };

  const deleteComment = async (id: number) => {
    if (!confirm("정말 이 댓글을 삭제하시겠습니까? (대댓글도 함께 삭제됩니다)")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (!error) onCommentUpdated();
  };

  const renderCommentItem = (c: Comment, isReply: boolean = false) => (
    <div className={`flex items-start gap-3 ${isReply ? "py-3" : "py-5"} group transition-colors`}>
      
      <div 
        onClick={() => router.push(`/user/${c.user_id}`)}
        className={`flex-shrink-0 rounded-full flex items-center justify-center font-bold border border-border shadow-sm cursor-pointer transition-transform hover:scale-105 ${
          isReply 
          ? "w-8 h-8 bg-primary/10 text-primary text-xs" 
          : "w-10 h-10 bg-muted text-muted-foreground text-sm hover:bg-primary/20 hover:text-primary"
        }`}
      >
        {(c.nickname || "U").charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span 
            onClick={() => router.push(`/user/${c.user_id}`)}
            className="font-extrabold text-foreground text-sm cursor-pointer hover:text-primary transition-colors"
          >
            {c.nickname || "익명 사용자"}
          </span>
          <span className="text-xs font-bold text-muted-foreground">{timeAgo(c.created_at)}</span>
        </div>

        {editingId === c.id ? (
          <div className="mt-2 bg-background border border-primary/30 shadow-sm p-3 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <textarea className="w-full bg-transparent text-sm text-foreground resize-none outline-none min-h-[60px]" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-border">
              <button onClick={cancelEdit} className="px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted rounded-lg transition-colors">취소</button>
              <button onClick={() => submitEdit(c.id)} className="px-3 py-1.5 text-xs font-bold text-primary-foreground bg-primary shadow-sm hover:opacity-90 rounded-lg transition-colors">저장</button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap mt-0.5">{c.content}</div>
        )}

        {!editingId && (
          <div className="flex items-center gap-3 mt-2.5">
            {!isReply && currentUserId && (
              <button onClick={() => setReplyingId(replyingId === c.id ? null : c.id)} className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors">
                {replyingId === c.id ? "답글 취소" : "답글 달기"}
              </button>
            )}

            {currentUserId && currentUserId !== c.user_id && (
              <button 
                onClick={() => onReport('comment', c.id, c.nickname || "익명 사용자", c.content)}
                className="text-[11px] font-bold text-muted-foreground hover:text-destructive transition-colors flex items-center gap-0.5"
              >
                <Icons.Alert /> 신고
              </button>
            )}

            {currentUserId === c.user_id && (
              <div className="flex gap-2">
                <button 
                  onClick={() => startEdit(c)} 
                  className="text-[11px] font-bold text-muted-foreground/60 hover:text-primary transition-colors"
                >
                  수정
                </button>
                <button 
                  onClick={() => deleteComment(c.id)} 
                  className="text-[11px] font-bold text-muted-foreground/60 hover:text-destructive transition-colors"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        )} {/* 이 부분이 실수로 지워졌었습니다! */}

        {replyingId === c.id && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <CommentForm
              postId={postId}
              userId={currentUserId}
              parentId={c.id}
              autoFocus={true}
              onCommentAdded={() => {
                setReplyingId(null);
                onCommentUpdated();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (comments.length === 0)
    return (
      <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border transition-colors font-bold text-sm">
        <div className="text-3xl mb-2 opacity-50">💬</div>
        첫 번째 댓글을 남겨보세요!
      </div>
    );

  return (
    <ul className="divide-y divide-border transition-colors">
      {parentComments.map((parent) => {
        const replies = childComments
          .filter((child) => child.parent_id === parent.id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return (
          <li key={parent.id} className="relative">
            {renderCommentItem(parent, false)}

            {replies.length > 0 && (
              <ul className="ml-5 sm:ml-12 mt-1 mb-4 space-y-1">
                {replies.map((reply) => (
                  <li key={reply.id} className="flex gap-2 sm:gap-3 items-start">
                    <div className="mt-4 text-border flex-shrink-0">
                      <Icons.CornerDownRight />
                    </div>
                    <div className="flex-1 min-w-0 bg-muted/30 rounded-2xl px-3 sm:px-4">
                      {renderCommentItem(reply, true)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
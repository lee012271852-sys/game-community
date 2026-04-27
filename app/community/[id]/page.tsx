"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "../../../lib/supabaseClient"; 
import CommentForm from "../../components/CommentForm";
import CommentList from "../../components/CommentList";
import { useToast } from "../../components/ToastProvider"; 

const Icons = {
  Heart: ({ filled }: { filled?: boolean }) => (
    <svg className={`w-5 h-5 transition-colors ${filled ? "text-primary fill-primary" : "text-muted-foreground"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
  ),
  Eye: () => <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Share: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Bookmark: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>,
  Alert: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

interface Post { id: number; title: string; content: string; author: string; user_id?: string; views: number; likes: number; created_at?: string; category?: string; }
interface Comment { id: number; post_id: number; user_id: string; nickname: string; content: string; created_at: string; }

function timeAgo(dateString?: string) {
  if (!dateString) return "";
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return past.toLocaleDateString();
}

const getCategoryLabel = (cat?: string) => {
  const map: Record<string, string> = { strategy: "공략", humor: "유머", question: "질문", free: "자유" };
  return map[cat || "free"] || "자유";
}

export default function DetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const { triggerToast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserNickname, setCurrentUserNickname] = useState<string>("익명");
  const [loading, setLoading] = useState(true);

  // 스크랩 상태 관리
  const [isScrapped, setIsScrapped] = useState(false);

  // 통합 신고 상태 관리
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: number | string; author: string; content: string; } | null>(null);

  const viewUpdated = useRef(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setCurrentUserId(data.session?.user?.id || null);
      if (data.session?.user?.id) {
        const { data: profile } = await supabase.from("user_profiles").select("nickname").eq("id", data.session.user.id).single();
        if (profile) setCurrentUserNickname(profile.nickname);
      }
    };
    checkAuth();
  }, []);

  const fetchPost = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("community").select("*").eq("id", Number(id)).single();
    if (!error && data) setPost(data as Post);
    setLoading(false);
  };

  const fetchComments = async () => {
    if (!id) return;
    const { data, error } = await supabase.from("comments").select("*").eq("post_id", Number(id)).order("id", { ascending: true });
    if (!error && data) setComments(data as Comment[]);
  };

  // ⭐ DB의 'scraps' 테이블에서 스크랩 여부 확인
  const fetchScrapStatus = async (postId: number, userId: string) => {
    const { data } = await supabase
      .from("scraps") 
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();
      
    setIsScrapped(!!data);
  };

  const handleReportOpen = (type: 'post' | 'comment', targetId: number | string, author: string, content: string) => {
    if (!currentUserId) return triggerToast("로그인이 필요합니다.");
    setReportTarget({ type, id: targetId, author, content });
    setIsReportModalOpen(true);
  };

  const submitReport = async () => {
    if (!reportTarget || !reportReason.trim()) return triggerToast("신고 사유를 입력해주세요.");
    try {
      const { error } = await supabase.from("reports").insert({
        reporter: currentUserNickname,
        target: reportTarget.author,
        reason: `[${reportTarget.type === 'post' ? '게시글' : '댓글'} #${reportTarget.id}] ${reportReason}`,
        content: reportTarget.content,
        link: window.location.pathname,
        status: "pending"
      });
      if (error) throw error;
      triggerToast("🚨 신고가 정상적으로 접수되었습니다.");
      setIsReportModalOpen(false);
      setReportReason("");
      setReportTarget(null);
    } catch (error) {
      console.error("신고 에러:", error);
      triggerToast("신고 처리 중 문제가 발생했습니다.");
    }
  };

  const handleLike = async () => {
    if (!currentUserId) return triggerToast("로그인이 필요합니다.");
    const { data, error } = await supabase.rpc("toggle_like", { p_post_id: Number(id), p_user_id: currentUserId });
    if (!error) {
      triggerToast(data !== false ? "추천했습니다." : "추천을 취소했습니다.");
      fetchPost();
    }
  };

  // ⭐ 'scraps' 테이블에 추가/삭제 토글
  const handleScrap = async () => {
    if (!currentUserId) return triggerToast("로그인이 필요합니다.");

    if (isScrapped) {
      const { error } = await supabase.from("scraps").delete().eq("post_id", Number(id)).eq("user_id", currentUserId);
      if (!error) {
        setIsScrapped(false);
        triggerToast("스크랩이 취소되었습니다.");
      }
    } else {
      const { error } = await supabase.from("scraps").insert({ post_id: Number(id), user_id: currentUserId });
      if (!error) {
        setIsScrapped(true);
        triggerToast("스크랩 되었습니다.");
      }
    }
  };

  const deletePost = async () => {
    if (!confirm("정말 이 글을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("community").delete().eq("id", id);
    if (!error) { 
      alert("삭제되었습니다."); 
      router.push("/community"); 
    }
  };

  useEffect(() => {
    if (id && !viewUpdated.current) {
      viewUpdated.current = true;
      supabase.rpc("increase_views", { post_id: Number(id) });
      fetchPost();
      fetchComments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (id && currentUserId) {
      fetchScrapStatus(Number(id), currentUserId);
    }
  }, [id, currentUserId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  if (!post) return <div className="p-20 text-center">글을 찾을 수 없습니다.</div>;

  const isAuthor = currentUserId && post.user_id === currentUserId;

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => router.push("/community")} className="flex items-center gap-1 text-muted-foreground hover:text-primary text-sm font-bold transition-colors">
            <Icons.ArrowLeft /> 목록으로
          </button>
          {isAuthor && (
            <div className="flex gap-2">
              <button onClick={() => router.push(`/community/${id}/edit`)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-accent transition-colors"><Icons.Edit /> 수정</button>
              <button onClick={deletePost} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-destructive/20 text-destructive rounded-md hover:bg-destructive/10 transition-colors"><Icons.Trash /> 삭제</button>
            </div>
          )}
        </div>

        <article className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-8 border-b border-border bg-muted/5">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 mb-4 inline-block">
              {getCategoryLabel(post.category)}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mb-6 leading-tight">{post.title}</h1>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold cursor-pointer" onClick={() => post.user_id && router.push(`/user/${post.user_id}`)}>
                {post.author[0].toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold">{post.author}</div>
                <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                  <span>{timeAgo(post.created_at)}</span>
                  <span>•</span>
                  <span>조회 {post.views}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 min-h-[300px]">
            <div className="prose dark:prose-invert max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          <div className="py-10 flex flex-col items-center justify-center border-t border-border bg-muted/20">
            <button onClick={handleLike} className="flex flex-col items-center gap-2 px-8 py-3 bg-card border rounded-2xl shadow-sm hover:border-primary transition-all active:scale-95">
              <Icons.Heart filled={post.likes > 0} />
              <span className="text-sm font-bold">추천 {post.likes}</span>
            </button>
            <div className="flex items-center gap-6 mt-6">
               <button onClick={() => triggerToast("주소가 복사되었습니다.")} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"><Icons.Share /> 공유</button>
               
               <button 
                 onClick={handleScrap} 
                 className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${isScrapped ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
               >
                 <Icons.Bookmark /> {isScrapped ? "스크랩 취소" : "스크랩"}
               </button>
               
               <button onClick={() => handleReportOpen('post', post.id, post.author, post.content)} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-destructive transition-colors"><Icons.Alert /> 신고</button>
            </div>
          </div>
        </article>

        <div className="mt-8 bg-card rounded-2xl border border-border p-6 sm:p-8">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">댓글 <span className="text-primary">{comments.length}</span></h3>
          <CommentForm postId={Number(id)} userId={currentUserId} onCommentAdded={fetchComments} />
          <div className="mt-8 divide-y divide-border">
            <CommentList comments={comments} currentUserId={currentUserId} onCommentUpdated={fetchComments} postId={Number(id)} onReport={handleReportOpen} />
          </div>
        </div>
      </div>

      {/* 통합 신고 모달 */}
      {isReportModalOpen && reportTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-black text-foreground flex items-center gap-2 mb-2"><span className="text-destructive"><Icons.Alert /></span> {reportTarget.type === 'post' ? '게시글' : '댓글'} 신고하기</h3>
              <p className="text-xs text-muted-foreground mb-4">대상자: <span className="font-bold text-foreground">{reportTarget.author}</span></p>
              <textarea value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="신고 사유를 상세히 적어주세요..." className="w-full h-32 p-4 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-destructive/50 outline-none resize-none transition-all" autoFocus />
            </div>
            <div className="bg-muted/30 p-4 flex gap-3 justify-end border-t border-border">
              <button onClick={() => setIsReportModalOpen(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">취소</button>
              <button onClick={submitReport} className="px-5 py-2 text-sm font-bold text-white bg-destructive rounded-xl shadow-sm transition-transform active:scale-95">신고 접수</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
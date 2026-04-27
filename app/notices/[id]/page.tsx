"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient"; 
import CommentForm from "../../components/CommentForm"; 
import CommentList from "../../components/CommentList"; 

const Icons = {
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Share: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>,
  Alert: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Megaphone: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
};

interface Notice {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  is_important: boolean;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  nickname: string;
  content: string;
  created_at: string;
}

export default function NoticeDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [notice, setNotice] = useState<Notice | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserNickname, setCurrentUserNickname] = useState<string>("익명");
  const [loading, setLoading] = useState(true);

  // ⭐ 신고 관련 상태
  const [reportTarget, setReportTarget] = useState<{
    type: 'post' | 'comment';
    id: number | string;
    author: string;
    content: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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

  const fetchNotice = async () => {
    const { data, error } = await supabase.from("notices").select("*").eq("id", id).single();
    if (!error && data) setNotice(data);
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase.from("comments").select("*").eq("post_id", -Number(id)).order("id", { ascending: true });
    if (!error && data) setComments(data as Comment[]);
  };

  // ⭐ 통합 신고 함수 (자식에게 전달할 용도)
  const handleReportOpen = (type: 'post' | 'comment', targetId: number | string, author: string, content: string) => {
    if (!currentUserId) return alert("로그인이 필요합니다.");
    setReportTarget({ type, id: targetId, author, content });
    setIsReportModalOpen(true);
  };

  const submitReport = async () => {
    if (!reportTarget || !reportReason.trim()) return alert("신고 사유를 입력해주세요.");

    try {
      const { error } = await supabase.from("reports").insert({
        reporter: currentUserNickname,
        target: reportTarget.author,
        // 사유에 공지사항임을 명시
        reason: `[공지사항 ${reportTarget.type === 'post' ? '본문' : '댓글'} #${reportTarget.id}] ${reportReason}`,
        content: reportTarget.content,
        link: window.location.pathname,
        status: "pending"
      });
      if (error) throw error;
      alert("🚨 신고가 정상적으로 접수되었습니다.");
      setIsReportModalOpen(false);
      setReportReason("");
      setReportTarget(null);
    } catch (error) {
      console.error("신고 에러:", error);
      alert("신고 처리 중 문제가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (id) {
      fetchNotice();
      fetchComments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", { 
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" 
    });
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center bg-background"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!notice) return <div className="p-20 text-center font-bold text-muted-foreground">존재하지 않거나 삭제된 공지사항입니다.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-6">
          <button onClick={() => router.push("/notices")} className="flex items-center gap-1 text-muted-foreground hover:text-primary text-sm font-bold transition-colors">
            <Icons.ArrowLeft /> 목록으로
          </button>
        </div>

        <article className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-border bg-muted/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {notice.is_important ? <span className="px-2.5 py-1 bg-red-500 text-white rounded text-[11px] font-black tracking-widest shadow-sm">필독</span> : <span className="px-2.5 py-1 bg-primary/10 text-primary rounded text-[11px] font-bold">공지</span>}
              </div>
              {/* 본문 신고 버튼 */}
              <button onClick={() => handleReportOpen('post', notice.id, notice.author, notice.content)} className="text-muted-foreground hover:text-destructive transition-colors"><Icons.Alert /></button>
            </div>
            
            <h1 className={`text-2xl sm:text-3xl font-extrabold leading-tight mb-6 ${notice.is_important ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{notice.title}</h1>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm"><Icons.Megaphone /></div>
              <div>
                <div className="text-sm font-black text-foreground">{notice.author} <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded ml-1">운영자</span></div>
                <div className="text-xs text-muted-foreground mt-0.5">{formatDate(notice.created_at)}</div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 min-h-[300px]">
            <div className="prose dark:prose-invert max-w-none prose-lg leading-loose whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: notice.content }} />
          </div>
        </article>

        <div className="mt-8">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">댓글 <span className="text-primary">{comments.length}</span></h3>
            <div className="mb-8">
              <CommentForm postId={-Number(notice.id)} userId={currentUserId} onCommentAdded={fetchComments} />
            </div>
            <div className="divide-y divide-border">
              {/* ⭐ 에러 해결: onReport 속성 전달 */}
              <CommentList 
                comments={comments} 
                currentUserId={currentUserId} 
                onCommentUpdated={fetchComments} 
                postId={-Number(notice.id)} 
                onReport={handleReportOpen}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 통합 신고 모달 UI */}
      {isReportModalOpen && reportTarget && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-black text-foreground flex items-center gap-2 mb-2"><span className="text-destructive"><Icons.Alert /></span> {reportTarget.type === 'post' ? '공지 본문' : '댓글'} 신고</h3>
              <p className="text-xs text-muted-foreground mb-4 font-medium">대상자: {reportTarget.author}</p>
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
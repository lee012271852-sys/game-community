"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "../../../lib/supabaseClient";
import CommentForm from "../../components/CommentForm";
import CommentList from "../../components/CommentList";

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  image_url?: string;
  views: number;
  likes: number;
  created_at?: string;
  comment_count?: number;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  nickname: string;
  content: string;
  created_at: string;
}

export default function DetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 🔥 조회수 중복 증가 방지 ref
  const viewUpdated = useRef(false);

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    checkAuth();
  }, []);

  // ------------------ 유저 확인 ------------------
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  // ------------------ 게시글 불러오기 ------------------
  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("community") 
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) setPost(data as Post);
  };

  // ------------------ 댓글 불러오기 ------------------
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("id", { ascending: true });

    if (!error && data) setComments(data as Comment[]);
  };

  // ------------------ 조회수 증가 ------------------
  const increaseView = async () => {
    if (!id) return;
    const { error } = await supabase.rpc("increase_views", { post_id: Number(id) });
    if (error) console.error("조회수 증가 에러:", error);
  };

  // ------------------ 추천 토글 함수 ------------------
  const handleLike = async () => {
    if (!currentUserId) {
      alert("로그인이 필요한 기능입니다.");
      return;
    }
    if (!id) return;

    const { data, error } = await supabase.rpc("toggle_like", { 
      p_post_id: Number(id), 
      p_user_id: currentUserId 
    });
    
    if (error) {
      console.error("추천 처리 에러:", error);
      alert("오류가 발생했습니다.");
    } else {
      if (data === true) {
        alert("추천했습니다.");
      } else {
        alert("추천을 취소했습니다. ↩️");
      }
      fetchPost(); 
    }
  };

  // ------------------ 게시글 삭제 ------------------
  const deletePost = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("community").delete().eq("id", id);
    if (!error) router.push("/community");
  };

  // ------------------ 초기 로드 (조회수 2회 방지됨) ------------------
  useEffect(() => {
    if (id && !viewUpdated.current) {
      viewUpdated.current = true; // 중복 실행 차단
      increaseView();
      fetchPost();
      fetchComments();
    }
  }, [id]);

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto mt-12 text-center text-gray-600">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8FF]">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* 로고 */}
          <button onClick={() => router.push("/")} className="text-2xl font-extrabold text-indigo-600 hover:text-indigo-700">GameSeed</button>
          
          {/* 네비게이션 메뉴 */}
          <nav className="flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => router.push("/community")}
              className="text-gray-700 hover:text-indigo-600"
            >
              커뮤니티
            </button>
            <button
              onClick={() => router.push("/review")}
              className="text-gray-700 hover:text-indigo-600"
            >
              평론
            </button>
            <button
              onClick={() => router.push("/recommend")}
              className="text-gray-700 hover:text-indigo-600"
            >
              AI 추천
            </button>
            <button
              onClick={() => router.push("/news")}
              className="text-gray-700 hover:text-indigo-600"
            >
              뉴스
            </button>
          </nav>

          {/* 로그인 상태 */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.email}</span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    router.refresh();
                  }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/auth")}
                  className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                >
                  로그인
                </button>
                <button
                  onClick={() => router.push("/auth?mode=signup")}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                >
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <button className="text-sky-600 text-sm font-medium hover:underline mb-4" onClick={() => router.push("/community")}>
          ← 커뮤니티로 돌아가기
        </button>

        <div className="bg-white p-6 rounded-xl shadow border">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{post.title}</h1>
          <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-3">
            <span>작성자: {post.author || "익명"}</span>
            <span>조회 {post.views}</span>
            <span>추천 {post.likes}</span>
            <span>댓글 {post.comment_count || 0}</span>
            <span>{post.created_at ? new Date(post.created_at).toLocaleString() : ""}</span>
          </div>
          {post.image_url && <img src={post.image_url} alt="" className="w-full rounded-lg mb-6" />}
          <div className="prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* 버튼들 */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleLike} 
            className="px-5 py-2.5 bg-pink-500 text-white rounded-lg font-semibold shadow hover:bg-pink-600 active:scale-95 transition-transform"
          >
            ❤️ 추천하기
          </button>

          <button onClick={() => router.push(`/community/${id}/edit`)} className="px-5 py-2.5 bg-gray-700 text-white rounded-lg">
            수정
          </button>
          <button onClick={deletePost} className="px-5 py-2.5 bg-red-500 text-white rounded-lg">
            삭제
          </button>
        </div>

        {/* 댓글 */}
        <div className="mt-10 bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">댓글</h2>
          <CommentForm postId={Number(id)} userId={currentUserId} onCommentAdded={fetchComments} />
          <CommentList comments={comments} currentUserId={currentUserId} onCommentUpdated={fetchComments} />
        </div>
      </div>
    </div>
  );
}

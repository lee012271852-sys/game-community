"use client";

import { useEffect, useState } from "react";
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
    await supabase.rpc("increase_views", { post_id: Number(id) });
  };

  // ------------------ 추천 증가 ------------------
  const increaseLike = async () => {
    await supabase.rpc("increase_likes", { post_id: Number(id) });
    fetchPost();
  };

  // ------------------ 게시글 삭제 ------------------
  const deletePost = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("community").delete().eq("id", id);
    if (!error) router.push("/community");
  };

  // ------------------ 초기 로드 ------------------
  useEffect(() => {
    increaseView();
    fetchPost();
    fetchComments();
  }, []);

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto mt-12 text-center text-gray-600">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8FF]">

      {/* ------------------ 상단 네비 ------------------ */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/")}
              className="text-2xl font-extrabold text-sky-600"
            >
              GameVerse
            </button>

            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-600">
              <button onClick={() => router.push("/review")} className="hover:text-sky-600">평론</button>
              <button onClick={() => router.push("/news")} className="hover:text-sky-600">뉴스</button>
              <button onClick={() => router.push("/community")} className="hover:text-sky-600">커뮤니티</button>
              <button onClick={() => router.push("/recommend")} className="hover:text-sky-600">게임 추천</button>
            </nav>
          </div>

          {!currentUserId && (
            <button
              onClick={() => router.push("/auth")}
              className="px-3 py-1.5 text-sm rounded bg-sky-100 text-sky-700 hover:bg-sky-200"
            >
              로그인
            </button>
          )}
        </div>
      </header>

      {/* ------------------ 메인 컨텐츠 ------------------ */}
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* 뒤로가기 */}
        <button
          className="text-sky-600 text-sm font-medium hover:underline mb-4"
          onClick={() => router.push("/community")}
        >
          ← 커뮤니티로 돌아가기
        </button>

        {/* ------------------ 게시글 카드 ------------------ */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {post.title}
          </h1>

          <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-3">
            <span>작성자: {post.author}</span>
            <span>조회 {post.views}</span>
            <span>추천 {post.likes}</span>
            <span>댓글 {post.comment_count}</span>
            <span>
              {post.created_at ? new Date(post.created_at).toLocaleString() : ""}
            </span>
          </div>

          {post.image_url && (
            <img
              src={post.image_url}
              alt="image"
              className="w-full rounded-lg mb-6"
            />
          )}

          <div
            className="prose max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>

        {/* ------------------ 추천/수정/삭제 버튼 ------------------ */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={increaseLike}
            className="px-5 py-2.5 bg-pink-500 text-white rounded-lg font-semibold shadow hover:bg-pink-600"
          >
            ❤️ 추천하기
          </button>

          <button
            onClick={() => router.push(`/community/${id}/edit`)}
            className="px-5 py-2.5 bg-gray-700 text-white rounded-lg"
          >
            수정
          </button>

          <button
            onClick={deletePost}
            className="px-5 py-2.5 bg-red-500 text-white rounded-lg"
          >
            삭제
          </button>
        </div>

        {/* ------------------ 댓글 구역 ------------------ */}
        <div className="mt-10 bg-white rounded-xl border shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4">댓글</h2>

          {/* 댓글 입력창 */}
          <CommentForm
            postId={Number(id)}
            userId={currentUserId}
            onCommentAdded={fetchComments}
          />

          {/* 댓글 리스트 */}
          <CommentList
            comments={comments}
            currentUserId={currentUserId}
            onCommentUpdated={fetchComments}
          />
        </div>
      </div>
    </div>
  );
}
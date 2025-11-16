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
  image_url?: string; // ✅ DB에 저장된 public URL 그대로
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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("community")
      .select("*")
      .eq("id", id)
      .single();
    if (!error && data) setPost(data as Post);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("id", { ascending: true });
    if (!error && data) setComments(data as Comment[]);
  };

  const increaseView = async () => {
    await supabase.rpc("increase_views", { post_id: Number(id) });
  };

  const increaseLike = async () => {
    await supabase.rpc("increase_likes", { post_id: Number(id) });
    fetchPost();
  };

  const deletePost = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const { error } = await supabase.from("community").delete().eq("id", id);
    if (!error) router.push("/community");
  };

  useEffect(() => {
    increaseView();
    fetchPost();
    fetchComments();
  }, []);

  if (!post) return <p>불러오는 중...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button
        className="mb-4 text-blue-500"
        onClick={() => router.push("/community")}
      >
        ← 목록으로
      </button>

      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <div className="text-gray-500 mb-4">
        작성자: {post.author} · 조회 {post.views} · 추천 {post.likes} · 댓글{" "}
        {post.comment_count || 0} · 작성일{" "}
        {post.created_at ? new Date(post.created_at).toLocaleString() : ""}
      </div>

      {/* ✅ DB에 저장된 public URL 바로 사용 */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="image"
          className="w-full rounded-md mb-4"
        />
      )}

      <p className="whitespace-pre-wrap text-lg mb-8">{post.content}</p>

      <div className="flex gap-2 mb-8">
        <button
          onClick={increaseLike}
          className="px-4 py-2 bg-pink-500 text-white rounded"
        >
          ❤️ 추천하기
        </button>

        <button
          onClick={() => router.push(`/community/${id}/edit`)}
          className="px-4 py-2 bg-gray-600 text-white rounded"
        >
          수정
        </button>

        <button
          onClick={deletePost}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          삭제
        </button>
      </div>

      {/* 댓글 Form & List */}
      <CommentForm
        postId={Number(id)}
        userId={currentUserId}
        onCommentAdded={fetchComments}
      />

      <CommentList
        comments={comments}
        currentUserId={currentUserId}
        onCommentUpdated={fetchComments}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  image_url?: string;
  created_at?: string;
  views: number;
  likes: number;
  comment_count: number;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("community")
        .select("*, comments(count)")  // 🔥 댓글 개수 자동 계산
        .order("id", { ascending: false });

      if (!error && data) {
        // 🔥 comments(count) 값을 comment_count 로 변환
        const formatted = data.map((item: any) => ({
          ...item,
          comment_count: item.comments?.[0]?.count || 0,
        }));

        setPosts(formatted);
      } else {
        console.error(error);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">

      {/* 🔹 메인으로 돌아가기 버튼 */}
      <button
        className="mb-4 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        onClick={() => router.push("/")}
      >
        ← 메인으로
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">커뮤니티 게시판</h1>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => router.push("/community/write")}
        >
          글쓰기
        </button>
      </div>

      {posts.length === 0 ? (
        <p>게시물이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className="border rounded p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`/community/${post.id}`)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">{post.title}</h3>
                <span className="text-sm text-gray-500">조회 {post.views}</span>
              </div>

              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="thumb"
                  className="w-full h-48 object-cover rounded mt-2"
                />
              )}

              <div className="flex justify-between text-sm text-gray-500 mt-3">
                <span>작성자: {post.author}</span>
                <span>
                  추천 {post.likes} · 댓글 {post.comment_count} ·{" "}
                  {post.created_at
                    ? new Date(post.created_at).toLocaleString()
                    : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

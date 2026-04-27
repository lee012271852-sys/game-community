"use client";

import { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

interface Post {
  id: number;
  title: string;
  author: string;
  created_at: string;
  views: number;
  likes: number;
  comment_count: number;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [sort, setSort] = useState<"latest" | "likes" | "views">("latest");

  const [user, setUser] = useState<any>(null); // 로그인 상태 확인

  const router = useRouter();

  /* ---------------------------
     🔹 유저 로그인 정보 확인
  --------------------------- */
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    checkAuth();
  }, []);

  /* ---------------------------
     🔹 게시글 가져오기
  --------------------------- */
  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("community")
        .select("*, comments(count)")
        .order("id", { ascending: false });

      if (!error && data) {
        const formatted = data.map((item: any) => ({
          ...item,
          comment_count: item.comments?.[0]?.count || 0,
        }));

        setPosts(formatted);
      }
    };

    fetchPosts();
  }, []);

  /* ---------------------------
     🔹 정렬 적용
  --------------------------- */
  const sortedPosts = [...posts].sort((a, b) => {
    if (sort === "latest") return b.id - a.id;
    if (sort === "likes") return b.likes - a.likes;
    if (sort === "views") return b.views - a.views;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* ------------------------------
          🔹 상단 네비 (메인 홈과 유사 스타일)
      ------------------------------ */}
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

      {/* ------------------------------
          🔹 Hero 영역
      ------------------------------ */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900">
            게임 커뮤니티
          </h1>
          <p className="text-gray-600 mt-2">
            최신 게임 소식부터 사용자들의 의견을 자유롭게 공유하세요.
          </p>
        </div>

        {/* ------------------------------
            🔹 정렬 토글 + 글쓰기 버튼
        ------------------------------ */}
        <div className="flex justify-between items-center mt-8 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setSort("latest")}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                sort === "latest"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              최신순
            </button>

            <button
              onClick={() => setSort("likes")}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                sort === "likes"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              추천순
            </button>

            <button
              onClick={() => setSort("views")}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                sort === "views"
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              }`}
            >
              조회순
            </button>
          </div>

          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700"
            onClick={() => router.push("/community/write")}
          >
            글쓰기
          </button>
        </div>

        {/* ------------------------------
            🔹 게시글 테이블
        ------------------------------ */}
        <div className="bg-white border border-gray-200 rounded-lg">
          {/* 테이블 헤더 */}
          <div className="grid grid-cols-5 px-4 py-3 bg-gray-50 border-b text-sm font-semibold text-gray-600">
            <div className="col-span-3">제목</div>
            <div className="text-center">추천</div>
            <div className="text-center">조회수</div>
          </div>

          {/* 게시글 */}
          <ul>
            {sortedPosts.map((post) => (
              <li
                key={post.id}
                onClick={() => router.push(`/community/${post.id}`)}
                className="grid grid-cols-5 px-4 py-3 border-b hover:bg-indigo-50 cursor-pointer text-sm"
              >
                {/* 제목 */}
                <div className="col-span-3 flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">
                    {post.title}
                  </span>
                  <span className="text-indigo-600 text-xs">
                    [{post.comment_count}]
                  </span>
                </div>

                {/* 추천 */}
                <div className="text-center text-gray-700">{post.likes}</div>

                {/* 조회수 */}
                <div className="text-center text-gray-700">{post.views}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ------------------------------
          🔹 Footer
      ------------------------------ */}
      <footer className="py-8 border-t bg-white text-center text-sm text-gray-500">
        © 2025 GameSeed · 문의: team@example.com
      </footer>
    </div>
  );
}

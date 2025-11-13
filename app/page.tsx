"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <h1
            onClick={() => router.push("/")}
            className="text-2xl font-bold text-indigo-500 cursor-pointer"
          >
            GameVerse
          </h1>
          <nav className="flex space-x-8 text-gray-300">
            <button onClick={() => router.push("/community")} className="hover:text-indigo-400">
              커뮤니티
            </button>
            <button onClick={() => router.push("/review")} className="hover:text-indigo-400">
              평론
            </button>
            <button onClick={() => router.push("/recommend")} className="hover:text-indigo-400">
              추천
            </button>
            <button onClick={() => router.push("/mypage")} className="hover:text-indigo-400">
              마이페이지
            </button>
          </nav>
          <div className="space-x-3">
            <Button
              variant="outline"
              className="border-gray-600 text-gray-200 hover:bg-zinc-800"
              onClick={() => router.push("/login")}
            >
              로그인
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => router.push("/signup")}
            >
              회원가입
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center pt-40 pb-24 px-4 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <h2 className="text-5xl font-extrabold text-white mb-6 leading-tight">
          당신의 게임 경험을 <br /> 공유하고 추천받으세요.
        </h2>
        <p className="text-gray-400 mb-10 text-lg max-w-2xl">
          커뮤니티에서 소통하고, 평론을 남기고, AI로부터 새로운 게임을 추천받으세요.
        </p>
        <Button
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg rounded-xl"
          onClick={() => router.push("/recommend")}
        >
          AI 추천 받기 →
        </Button>
      </section>

      {/* Community Section */}
      <section className="max-w-7xl mx-auto py-20 px-6">
        <h3 className="text-3xl font-bold mb-8 text-white">🔥 최신 커뮤니티 글</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((id) => (
            <Card
              key={id}
              className="bg-zinc-900 border border-zinc-800 shadow-md hover:shadow-indigo-500/20 transition"
            >
              <CardContent className="p-6">
                <h4 className="text-xl font-semibold mb-2 text-indigo-400">
                  게임 토론 #{id}
                </h4>
                <p className="text-gray-400 mb-4">
                  오늘의 게임 소식과 토론을 함께 나눠보세요.
                </p>
                <Button
                  variant="link"
                  className="text-indigo-500 hover:text-indigo-400"
                  onClick={() => router.push(`/community/${id}`)}
                >
                  더보기 →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Review Section */}
      <section className="bg-zinc-900 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-3xl font-bold mb-8 text-white">⭐ 최신 평론</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((id) => (
              <Card
                key={id}
                className="bg-zinc-800 border border-zinc-700 shadow-md hover:shadow-indigo-500/20 transition"
              >
                <CardContent className="p-6">
                  <h4 className="text-xl font-semibold mb-2 text-indigo-400">
                    리뷰 #{id}
                  </h4>
                  <p className="text-gray-400 mb-4">
                    플레이어들이 직접 남긴 평론을 확인해보세요.
                  </p>
                  <Button
                    variant="link"
                    className="text-indigo-500 hover:text-indigo-400"
                    onClick={() => router.push(`/review/${id}`)}
                  >
                    자세히 보기 →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800 py-8 text-center text-gray-500">
        © 2025 GameVerse. All rights reserved.
      </footer>
    </div>
  );
}
"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { useRouter } from "next/navigation"

interface Review {
  id: number
  title: string
  content: string
  author: string
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("id", { ascending: false })
      if (!error && data) setReviews(data as Review[])
    }
    fetchReviews()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
        <h1>게임 커뮤니티</h1>
        <div>
          {user ? (
            <>
              <span style={{ marginRight: 12 }}>환영합니다, {user.email}</span>
              <button onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <button onClick={() => router.push("/auth")}>로그인 / 회원가입</button>
          )}
        </div>
      </header>

      <section style={{ marginBottom: 40 }}>
        <h2>추천 게임</h2>
        <div style={{ display: "flex", gap: 20, overflowX: "auto" }}>
          <div style={{ minWidth: 200, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}>게임 A</div>
          <div style={{ minWidth: 200, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}>게임 B</div>
          <div style={{ minWidth: 200, padding: 10, border: "1px solid #ccc", borderRadius: 8 }}>게임 C</div>
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2>최신 평론</h2>
        {reviews.length === 0 ? (
          <p>아직 작성된 평론이 없습니다.</p>
        ) : (
          <ul>
            {reviews.map((review) => (
              <li key={review.id} style={{ marginBottom: 20, padding: 10, border: "1px solid #eee", borderRadius: 8 }}>
                <h3>{review.title}</h3>
                <p>{review.content}</p>
                <small>작성자: {review.author}</small>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>커뮤니티 게시판</h2>
        <button onClick={() => router.push("/community")}>게시판 바로가기</button>
      </section>
    </div>
  )
}

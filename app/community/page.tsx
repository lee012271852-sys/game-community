"use client"

import { useEffect, useState } from "react"
import supabase from "../../lib/supabaseClient"

interface Post {
  id: number
  title: string
  content: string
  author: string
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase.from("community").select("*").order("id", { ascending: false })
      if (!error && data) setPosts(data as Post[])
    }
    fetchPosts()
  }, [])

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px" }}>
      <h1>커뮤니티 게시판</h1>
      {posts.length === 0 ? <p>게시물이 없습니다.</p> : (
        <ul>
          {posts.map(post => (
            <li key={post.id} style={{ marginBottom: 20, padding: 10, border: "1px solid #eee", borderRadius: 8 }}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
              <small>작성자: {post.author}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

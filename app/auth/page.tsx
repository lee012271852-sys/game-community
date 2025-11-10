"use client"

import { useState } from "react"
import supabase from "../../lib/supabaseClient"
import { useRouter } from "next/navigation"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleAuth = async () => {
    setMessage("")
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: "http://localhost:3000" }
        })
        if (error) throw error
        setMessage("회원가입 성공! 이메일 확인 없이 바로 로그인 가능합니다.")
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push("/") // 로그인 성공 시 홈으로 이동
      }
    } catch (err: any) {
      setMessage(err.message)
    }
  }

  return (
    <div style={{ width: 300, margin: "80px auto", textAlign: "center" }}>
      <h2>{isSignUp ? "회원가입" : "로그인"}</h2>
      <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", margin: "8px 0", padding: "8px" }} />
      <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", margin: "8px 0", padding: "8px" }} />
      <button onClick={handleAuth} style={{ width: "100%", padding: "8px", marginTop: "10px", cursor: "pointer" }}>
        {isSignUp ? "회원가입" : "로그인"}
      </button>
      <p style={{ color: "blue", marginTop: "12px", cursor: "pointer" }} onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? "로그인으로 돌아가기" : "회원가입하기"}
      </p>
      {message && <p style={{ marginTop: "10px", color: "red" }}>{message}</p>}
    </div>
  )
}

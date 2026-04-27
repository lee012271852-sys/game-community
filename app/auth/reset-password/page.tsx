"use client";

import React, { useState } from "react";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setMessage("비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함을 확인해주세요!");
    } catch (error: any) {
      setErrorMsg(error.message || "오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ⭐ [배경] 시스템 변수 적용
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 transition-colors duration-300">
      
      {/* ⭐ [카드] 통일감 있게 bg-card, border-border, rounded-3xl 적용 */}
      <div className="max-w-md w-full bg-card rounded-3xl shadow-lg overflow-hidden border border-border p-8 transition-colors">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-foreground mb-2 transition-colors">비밀번호 찾기 🔐</h1>
          <p className="text-muted-foreground text-sm transition-colors">
            가입한 이메일을 입력하시면<br />
            비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {/* 성공 메시지 - 다크모드에서도 잘 보이도록 반투명 배경 사용 */}
        {message && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-xl text-center transition-colors">
            <div className="text-2xl mb-2">✅</div>
            {message}
          </div>
        )}

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 text-destructive font-bold text-sm rounded-xl flex items-center gap-2 transition-colors">
            ⚠️ {errorMsg}
          </div>
        )}

        {!message && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1.5 transition-colors">이메일</label>
              {/* ⭐ [입력창] 로그인/가입 페이지와 동일하게 bg-muted 사용 */}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors font-medium text-foreground placeholder:text-muted-foreground"
                placeholder="name@example.com"
              />
            </div>

            {/* ⭐ [버튼] 시스템 primary 색상 사용 */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 mt-2 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] ${
                loading 
                  ? "bg-muted text-muted-foreground cursor-not-allowed" 
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {loading ? "전송 중..." : "재설정 링크 보내기"}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm border-t border-border pt-6 transition-colors">
          <Link href="/auth/login" className="text-muted-foreground hover:text-primary font-bold flex items-center justify-center gap-1 transition-colors">
            <span>←</span> 로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import supabase from "@/lib/supabaseClient";
import Link from "next/link";

export default function SignupPage() {
  // 입력 필드 상태 관리
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  
  // 이미지 관련 상태
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (password !== confirmPassword) {
        throw new Error("비밀번호가 일치하지 않습니다.");
      }
      if (password.length < 6) {
        throw new Error("비밀번호는 6자 이상이어야 합니다.");
      }

      let avatarUrl = "";

      if (profileImage) {
        const fileExt = profileImage.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, profileImage);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
        avatarUrl = data.publicUrl;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            nickname,
            avatar_url: avatarUrl,
          },
        },
      });

      if (error) throw error;
      setSuccessMsg("가입 인증 메일을 보냈습니다! 이메일을 확인해주세요.");

    } catch (error: any) {
      setErrorMsg(error.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ⭐ [배경] bg-gradient-to-br from-indigo-50 ... -> bg-background
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 py-10 transition-colors duration-300">
      
      {/* ⭐ [카드] bg-white -> bg-card, 테두리 border-border */}
      <div className="max-w-md w-full bg-card rounded-3xl shadow-lg overflow-hidden border border-border p-8 transition-colors">
        
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-foreground mb-2 transition-colors">회원가입 🚀</h1>
          <p className="text-muted-foreground text-sm transition-colors">GameSeed의 회원이 되어주세요.</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive font-bold text-sm rounded-xl">
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-lg font-bold text-foreground mb-2">이메일을 확인해주세요!</h3>
            <p className="text-muted-foreground text-sm mb-6">{successMsg}</p>
            <Link href="/auth/login" className="text-primary hover:underline font-bold text-sm">
              로그인 페이지로 돌아가기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            
            {/* 📸 프로필 사진 업로드 */}
            <div className="flex flex-col items-center mb-6">
              <label className="relative cursor-pointer group">
                {/* ⭐ [이미지 업로드 영역] bg-muted 적용 */}
                <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl opacity-50">📷</span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full shadow-md">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              <span className="text-xs text-muted-foreground mt-2 font-medium">프로필 사진 선택</span>
            </div>

            {/* 🆔 아이디 */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1.5">아이디</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                // ⭐ [입력창] bg-muted, text-foreground 명시하여 글씨가 잘 보이도록 수정
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors font-medium text-foreground placeholder:text-muted-foreground"
                placeholder="사용할 아이디 입력"
              />
            </div>

            {/* 📛 닉네임 */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1.5">닉네임</label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors font-medium text-foreground placeholder:text-muted-foreground"
                placeholder="커뮤니티에서 보일 이름"
              />
            </div>

            {/* 📧 이메일 */}
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-1.5">이메일 주소</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors font-medium text-foreground placeholder:text-muted-foreground"
                placeholder="name@example.com"
              />
            </div>

            {/* 🔒 비밀번호 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">비밀번호</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-colors font-medium text-foreground placeholder:text-muted-foreground"
                  placeholder="6자 이상"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-muted-foreground mb-1.5">비밀번호 확인</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-3 bg-muted border rounded-xl focus:ring-2 outline-none transition-colors font-medium text-foreground placeholder:text-muted-foreground ${
                    confirmPassword && password !== confirmPassword 
                      ? "border-destructive focus:ring-destructive/30" 
                      : "border-border focus:ring-primary/50 focus:border-primary"
                  }`}
                  placeholder="비밀번호 재입력"
                />
              </div>
            </div>
            {confirmPassword && password !== confirmPassword && (
               <p className="text-xs font-bold text-destructive mt-1 ml-1">비밀번호가 일치하지 않습니다.</p>
            )}

            <button
              type="submit"
              disabled={loading}
              // ⭐ [버튼] 시스템 primary 색상 사용
              className={`w-full py-3.5 mt-6 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] ${
                loading 
                  ? "bg-muted text-muted-foreground cursor-not-allowed" 
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {loading ? "가입 처리 중..." : "회원가입하기"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm border-t border-border pt-6 transition-colors">
          <span className="text-muted-foreground font-medium">이미 계정이 있으신가요? </span>
          <Link href="/auth/login" className="text-primary hover:underline font-bold">
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
}
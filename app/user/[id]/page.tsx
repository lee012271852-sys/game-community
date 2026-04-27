// app/user/[id]/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

const Icons = {
  ChevronLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  Mail: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Gamepad: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>,
  FileText: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>,
  Send: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
};

export default function UserPublicProfile() {
  const params = useParams();
  const router = useRouter();
  const targetUserId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [steamGames, setSteamGames] = useState<any[]>([]);
  
  // 로그인한 내 정보 (쪽지 보낼 때 사용)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      setLoading(true);
      
      // 내 로그인 정보 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);

      // 대상 유저 프로필 가져오기
      const { data: profileData, error } = await supabase
        .from("user_profiles")
        .select("id, nickname, username, avatar_url, steam_id")
        .eq("id", targetUserId)
        .maybeSingle();

      if (error || !profileData) {
        alert("존재하지 않거나 탈퇴한 유저입니다.");
        router.back();
        return;
      }
      setProfile(profileData);

      // 대상 유저가 쓴 최근 글 5개 가져오기
      const { data: postsData } = await supabase
        .from("community")
        .select("id, title, created_at, likes")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (postsData) setRecentPosts(postsData);

      // 대상 유저의 스팀 게임 리스트 (연동되어 있다면)
      if (profileData.steam_id) {
        const { data: gamesData } = await supabase
          .from("user_owned_games")
          .select("*")
          .eq("user_id", targetUserId)
          .order("playtime_forever", { ascending: false })
          .limit(12);
        if (gamesData) setSteamGames(gamesData);
      }

      setLoading(false);
    };

    fetchPublicData();
  }, [targetUserId, router]);

  const handleSendMessage = async () => {
    if (!currentUser) return alert("로그인이 필요합니다.");
    if (!messageContent.trim()) return alert("내용을 입력해주세요.");
    if (currentUser.id === targetUserId) return alert("자신에게는 쪽지를 보낼 수 없습니다.");

    setSendingMessage(true);
    try {
      // 내 닉네임 가져오기
      const { data: myProfile } = await supabase.from("user_profiles").select("nickname").eq("id", currentUser.id).single();
      
      await supabase.from("messages").insert({
        sender_id: currentUser.id,
        receiver_id: targetUserId,
        sender_nickname: myProfile?.nickname || "익명",
        content: messageContent,
      });

      alert(`${profile.nickname}님에게 쪽지를 보냈습니다! ✈️`);
      setShowMessageModal(false);
      setMessageContent("");
    } catch (error: any) {
      alert("쪽지 전송 실패: " + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary/20 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6">
      
      {/* 쪽지 보내기 모달 */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl shadow-xl max-w-md w-full p-8 border border-border animate-fade-in-up">
            <h3 className="text-xl font-extrabold text-foreground mb-6 flex items-center gap-2">
              <span className="text-indigo-600"><Icons.Mail /></span> 쪽지 보내기
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-bold text-muted-foreground mb-2">받는 사람</label>
              <div className="px-4 py-3 bg-muted border border-border rounded-xl text-foreground font-bold">{profile?.nickname}</div>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-bold text-muted-foreground mb-2">내용</label>
              <textarea placeholder="메시지를 작성해주세요" value={messageContent} onChange={(e) => setMessageContent(e.target.value)} className="w-full h-32 px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all font-medium text-sm text-foreground resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowMessageModal(false)} className="flex-1 py-3 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-accent transition-colors">취소</button>
              <button onClick={handleSendMessage} disabled={sendingMessage} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {sendingMessage ? "전송 중..." : <><Icons.Send /> 보내기</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-bold text-muted-foreground hover:text-indigo-600 mb-6 transition-colors w-fit">
          <Icons.ChevronLeft /> 뒤로가기
        </button>

        {/* 프로필 카드 */}
        <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>
          <div className="px-8 pb-8 relative flex flex-col sm:flex-row items-center sm:items-end gap-6">
            <div className="relative w-28 h-28 -mt-14 z-10 rounded-full border-4 border-card bg-muted flex items-center justify-center text-5xl overflow-hidden shadow-md">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : "👾"}
            </div>
            <div className="flex-1 text-center sm:text-left -mt-2 sm:mt-0">
              <h1 className="text-2xl font-black text-foreground">{profile?.nickname}</h1>
              <p className="text-sm font-bold text-indigo-500 mt-1">@{profile?.username}</p>
            </div>
            <button 
              onClick={() => {
                if (!currentUser) { alert("로그인이 필요합니다."); router.push('/auth/login'); }
                else { setShowMessageModal(true); }
              }} 
              className="mt-4 sm:mt-0 px-6 py-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-xl flex items-center gap-2 transition-colors active:scale-95"
            >
              <Icons.Mail /> 쪽지 보내기
            </button>
          </div>
        </div>

        {/* 최근 활동 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 최근 작성한 글 */}
          <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
            <h3 className="text-lg font-extrabold mb-5 flex items-center gap-2 text-foreground">
              <span className="text-indigo-600"><Icons.FileText /></span> 최근 작성한 글
            </h3>
            {recentPosts.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentPosts.map((post) => (
                  <li key={post.id} onClick={() => router.push(`/community/${post.id}`)} className="py-3 cursor-pointer group hover:bg-indigo-50/50 px-2 -mx-2 rounded-xl transition-colors">
                    <h4 className="text-sm font-bold text-foreground group-hover:text-indigo-600 truncate transition-colors">{post.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-12 text-center text-sm font-bold text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
                작성한 글이 없습니다.
              </div>
            )}
          </div>

          {/* 스팀 라이브러리 (연동된 유저만 표시) */}
          {profile?.steam_id ? (
            <div className="bg-card p-6 rounded-3xl shadow-sm border border-border">
              <h3 className="text-lg font-extrabold mb-5 flex items-center gap-2 text-foreground">
                <span className="text-indigo-600"><Icons.Gamepad /></span> 주로 하는 게임
              </h3>
              {steamGames.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {steamGames.slice(0, 6).map((game) => (
                    <div key={game.appid} className="bg-muted border border-border rounded-xl p-3 flex flex-col items-center text-center">
                      {game.img_icon_url ? (
                        <img src={game.img_icon_url} alt={game.game_title} className="w-10 h-10 rounded-lg mb-2 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg mb-2 bg-background flex items-center justify-center font-bold text-muted-foreground text-xs">{game.game_title[0]}</div>
                      )}
                      <div className="text-[10px] font-extrabold text-foreground line-clamp-1 w-full" title={game.game_title}>{game.game_title}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm font-bold text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">게임 정보가 없습니다.</div>
              )}
            </div>
          ) : (
            <div className="bg-card p-6 rounded-3xl shadow-sm border border-border flex flex-col items-center justify-center text-center py-12">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-3"><Icons.Gamepad /></div>
              <p className="text-sm font-bold text-muted-foreground">스팀 계정이 연동되지<br/>않은 유저입니다.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
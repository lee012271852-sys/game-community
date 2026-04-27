"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

interface UserProfile {
  id: string;
  nickname: string;
  email: string;
  role: string;
  created_at: string;
}

const Icons = {
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  More: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  Shield: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. 유저 목록 불러오기
  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  // 2. 권한 변경 함수 (예: 유저 <-> 관리자)
  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`권한을 ${newRole}(으)로 변경하시겠습니까?`)) return;

    const { error } = await supabase
      .from("user_profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (!error) {
      alert("권한이 변경되었습니다.");
      fetchUsers();
    }
  };

  // 3. 검색 필터링 (null 값 방어 로직 추가)
  const filteredUsers = users.filter(u => {
    // 닉네임이나 이메일이 없을 경우를 대비해 빈 문자열("")을 기본값으로 둡니다.
    const nickname = u.nickname || "";
    const email = u.email || "";
    const search = searchTerm.toLowerCase();

    return (
      nickname.toLowerCase().includes(search) || 
      email.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* 상단 타이틀 & 검색바 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">회원 관리</h2>
          <p className="text-sm text-muted-foreground font-medium">가입된 전체 회원 정보를 관리합니다.</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground">
            <Icons.Search />
          </div>
          <input 
            type="text" 
            placeholder="닉네임 또는 이메일 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* 회원 리스트 테이블 */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-6 py-4">사용자</th>
                <th className="px-6 py-4">이메일</th>
                <th className="px-6 py-4">권한</th>
                <th className="px-6 py-4">가입일</th>
                <th className="px-6 py-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center text-sm font-bold text-muted-foreground">데이터를 불러오는 중...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-sm font-bold text-muted-foreground">검색 결과가 없습니다.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-200">
      {/* ⭐ 닉네임이 없으면 'U'를 기본값으로 사용 */}
      {(user.nickname || "U")[0].toUpperCase()}
    </div>
    <span className="font-bold text-sm">
      {/* ⭐ 닉네임이 없으면 '익명 사용자'로 표시 */}
      {user.nickname || "익명 사용자"}
    </span>
  </div>
</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{user.email || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${
                        user.role === "admin" 
                        ? "bg-indigo-600 text-white" 
                        : "bg-secondary text-secondary-foreground"
                      }`}>
                        {user.role === "admin" ? "ADMIN" : "USER"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => toggleRole(user.id, user.role)}
                          className="p-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors text-muted-foreground"
                          title="권한 변경"
                        >
                          <Icons.Shield />
                        </button>
                        <button 
                          onClick={() => alert("차단 기능은 현재 준비 중입니다.")}
                          className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-muted-foreground"
                          title="활동 정지"
                        >
                          <Icons.More />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase">총 회원 수</p>
          <p className="text-2xl font-black mt-1">{users.length}명</p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase">오늘 가입</p>
          <p className="text-2xl font-black mt-1 text-indigo-600">
            {users.filter(u => new Date(u.created_at).toDateString() === new Date().toDateString()).length}명
          </p>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase">관리자 계정</p>
          <p className="text-2xl font-black mt-1">{users.filter(u => u.role === "admin").length}명</p>
        </div>
      </div>
    </div>
  );
}
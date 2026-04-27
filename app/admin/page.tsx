"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

interface UserStat {
  nickname: string;
  created_at: string;
}

interface ReportStat {
  id: number;
  reason: string;
  status: string;
  created_at: string;
}

// ⭐ 공지사항 타입 추가
interface NoticeStat {
  id: number;
  title: string;
  target_page: string;
  is_important: boolean;
  created_at: string;
}

// target_page를 한글로 변환하는 함수
const getPageLabel = (id: string) => {
  const map: Record<string, string> = {
    all: "전체", home: "홈", community: "커뮤니티", review: "평론", ai: "AI 추천", news: "뉴스"
  };
  return map[id] || "전체";
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalReviews: 0,
    pendingReports: 0,
  });
  const [recentUsers, setRecentUsers] = useState<UserStat[]>([]);
  const [recentReports, setRecentReports] = useState<ReportStat[]>([]);
  const [recentNotices, setRecentNotices] = useState<NoticeStat[]>([]); // ⭐ 최근 공지 상태 추가
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. 기본 통계 계산
      const [{ count: usersCount }, { count: postsCount }, { count: reviewsCount }, { count: reportsCount }] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('community').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      setStats({
        totalUsers: usersCount || 0,
        totalPosts: postsCount || 0,
        totalReviews: reviewsCount || 0,
        pendingReports: reportsCount || 0,
      });

      // 2. 최근 가입 유저 5명 가져오기
      const { data: userData } = await supabase
        .from('user_profiles')
        .select('nickname, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (userData) setRecentUsers(userData);

      // 3. 최근 신고 내역 5건 가져오기
      const { data: reportData } = await supabase
        .from('reports')
        .select('id, reason, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (reportData) setRecentReports(reportData);

      // 4. ⭐ 최근 공지사항 5건 가져오기
      const { data: noticeData } = await supabase
        .from('notices')
        .select('id, title, target_page, is_important, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      if (noticeData) setRecentNotices(noticeData);

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const formatSimpleDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="p-10 font-bold text-muted-foreground">데이터를 분석 중...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-black text-foreground mb-6 text-indigo-600">대시보드 요약</h2>
      
      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard title="총 가입 유저" value={`${stats.totalUsers}명`} color="bg-blue-500" />
        <StatCard title="작성된 게시글" value={`${stats.totalPosts}개`} color="bg-emerald-500" />
        <StatCard title="등록된 게임 리뷰" value={`${stats.totalReviews}개`} color="bg-purple-500" />
        <StatCard title="처리 대기 신고" value={`${stats.pendingReports}건`} color="bg-rose-500" />
      </div>

      {/* ⭐ 3단 그리드로 변경하여 공지사항 섹션 추가 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 최근 가입 유저 섹션 */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-foreground mb-5 flex items-center gap-2">
            🆕 최근 가입 유저
          </h3>
          <div className="space-y-3">
            {recentUsers.length > 0 ? recentUsers.map((u, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs">
                    {(u.nickname || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-bold">{u.nickname || "익명"}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{formatSimpleDate(u.created_at)}</span>
              </div>
            )) : <p className="text-center py-10 text-xs text-muted-foreground">가입 유저가 없습니다.</p>}
          </div>
        </div>

        {/* 최근 접수된 신고 섹션 */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-rose-500 mb-5 flex items-center gap-2">
            🚨 최근 접수된 신고
          </h3>
          <div className="space-y-3">
            {recentReports.length > 0 ? recentReports.map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-rose-50/30 dark:bg-rose-900/5 rounded-2xl border border-rose-100 dark:border-rose-900/20">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-bold truncate">{r.reason}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{formatSimpleDate(r.created_at)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  r.status === 'pending' ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {r.status}
                </span>
              </div>
            )) : <p className="text-center py-10 text-xs text-muted-foreground">접수된 신고가 없습니다.</p>}
          </div>
        </div>

        {/* ⭐ 최근 등록된 공지사항 섹션 */}
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm">
          <h3 className="font-extrabold text-indigo-500 mb-5 flex items-center gap-2">
            📢 최근 등록된 공지
          </h3>
          <div className="space-y-3">
            {recentNotices.length > 0 ? recentNotices.map((n, i) => (
              <div key={i} className="flex items-start flex-col p-3 bg-indigo-50/30 dark:bg-indigo-900/5 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                <div className="flex items-center gap-2 mb-1.5 w-full">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${n.is_important ? "bg-rose-100 text-rose-600" : "bg-muted text-muted-foreground"}`}>
                    {n.is_important ? "필독" : "일반"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold truncate">
                    {getPageLabel(n.target_page)}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{formatSimpleDate(n.created_at)}</span>
                </div>
                <p className="text-sm font-bold truncate w-full">{n.title}</p>
              </div>
            )) : <p className="text-center py-10 text-xs text-muted-foreground">등록된 공지가 없습니다.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string, value: string, color: string }) {
  return (
    <div className="bg-card border border-border p-6 rounded-3xl shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${color}`}></div>
      <p className="text-sm font-bold text-muted-foreground mb-1 ml-2">{title}</p>
      <p className="text-3xl font-black text-foreground ml-2">{value}</p>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";

interface Report {
  id: number;
  created_at: string;
  reporter: string;
  target: string;
  reason: string;
  content?: string;
  link?: string;
  status: string;
}

const Icons = {
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Filter: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ⭐ 검색, 필터, 다중 선택용 State 추가
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        if (data) setReports(data);
      } catch (error) {
        console.error("데이터 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  // ⭐ 1. 검색 및 필터링 로직 적용
  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      report.reporter.includes(searchQuery) || 
      report.target.includes(searchQuery) || 
      report.reason.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ⭐ 2. 통계 대시보드 데이터 계산
  const totalCount = reports.length;
  const pendingCount = reports.filter(r => r.status === "pending").length;
  const resolvedCount = reports.filter(r => r.status === "resolved").length;
  const rejectedCount = reports.filter(r => r.status === "rejected").length;
  const resolvedRate = totalCount === 0 ? 0 : Math.round(((resolvedCount + rejectedCount) / totalCount) * 100);

  // ⭐ 3. 체크박스 선택 로직
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReports.length) {
      setSelectedIds([]); // 전부 해제
    } else {
      setSelectedIds(filteredReports.map(r => r.id)); // 전부 선택
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  // 단일 처리 및 다중(일괄) 처리 통합 함수
  const handleAction = async (ids: number[], newStatus: 'resolved' | 'rejected') => {
    if (ids.length === 0) return;
    const actionText = newStatus === 'resolved' ? '정지' : '반려';
    
    if (!confirm(`선택한 ${ids.length}건의 신고를 ${actionText} 처리하시겠습니까?`)) return;

    try {
      // Supabase의 .in() 필터를 사용해 여러 개를 한 번에 업데이트
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .in('id', ids);

      if (error) throw error;

      // 화면 상태 즉시 업데이트
      setReports((prev) => prev.map(report => ids.includes(report.id) ? { ...report, status: newStatus } : report));
      setSelectedIds([]); // 선택 초기화
      
      alert(`${ids.length}건이 성공적으로 ${actionText} 되었습니다.`);
    } catch (error) {
      console.error("업데이트 에러:", error);
      alert("처리 중 문제가 발생했습니다.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">대기 중</span>;
      case "resolved": return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">정지 완료</span>;
      case "rejected": return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">반려됨</span>;
      default: return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 📊 1. 통계 대시보드 영역 */}
      <div>
        <h2 className="text-2xl font-black text-gray-800 dark:text-gray-100 tracking-tight mb-4">🚨 신고 처리 대시보드</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm font-bold text-gray-500">누적 신고</p>
            <p className="text-3xl font-black mt-1 text-gray-800 dark:text-gray-100">{totalCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-900/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-100 dark:bg-amber-900/20 rounded-bl-full -z-10"></div>
            <p className="text-sm font-bold text-amber-600">처리 대기 (필요)</p>
            <p className="text-3xl font-black mt-1 text-amber-500">{pendingCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm font-bold text-gray-500">정지/제재</p>
            <p className="text-3xl font-black mt-1 text-green-500">{resolvedCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm font-bold text-gray-500">전체 처리율</p>
            <p className="text-3xl font-black mt-1 text-indigo-500">{resolvedRate}%</p>
          </div>
        </div>

        {/* 시각적 진행바 */}
        {totalCount > 0 && (
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full mt-4 flex overflow-hidden border border-gray-200 dark:border-gray-700">
            <div style={{ width: `${(resolvedCount / totalCount) * 100}%` }} className="h-full bg-green-500 transition-all"></div>
            <div style={{ width: `${(rejectedCount / totalCount) * 100}%` }} className="h-full bg-gray-400 transition-all"></div>
            <div style={{ width: `${(pendingCount / totalCount) * 100}%` }} className="h-full bg-amber-400 transition-all"></div>
          </div>
        )}
      </div>

      {/* 🔍 2. 검색, 필터 및 일괄 처리 컨트롤 바 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10">
        
        {/* 검색 및 필터 */}
        <div className="flex flex-1 w-full gap-2">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Icons.Search />
            </div>
            <input 
              type="text" 
              placeholder="닉네임, 신고 사유 검색..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Icons.Filter />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
            >
              <option value="all">전체 상태</option>
              <option value="pending">대기 중</option>
              <option value="resolved">정지 완료</option>
              <option value="rejected">반려됨</option>
            </select>
          </div>
        </div>

        {/* 🚀 일괄 처리 액션 버튼 (선택된 항목이 있을 때만 활성화) */}
        <div className="flex gap-2 w-full md:w-auto transition-opacity">
          <span className="text-sm font-bold flex items-center text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
            {selectedIds.length}개 선택됨
          </span>
          <button 
            disabled={selectedIds.length === 0}
            onClick={() => handleAction(selectedIds, 'resolved')}
            className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
          >
            일괄 정지
          </button>
          <button 
            disabled={selectedIds.length === 0}
            onClick={() => handleAction(selectedIds, 'rejected')}
            className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
          >
            일괄 반려
          </button>
        </div>
      </div>

      {/* 📋 3. 신고 목록 테이블 (체크박스 포함) */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/80 border-b border-gray-100 dark:border-gray-700">
              <tr>
                {/* 전체 선택 체크박스 */}
                <th className="px-4 py-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredReports.length > 0 && selectedIds.length === filteredReports.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-4 font-bold">접수 정보</th>
                <th className="px-6 py-4 font-bold">당사자</th>
                <th className="px-6 py-4 font-bold w-1/3">신고 사유 및 증거</th>
                <th className="px-6 py-4 font-bold text-center">상태</th>
                <th className="px-6 py-4 font-bold text-center">관리 (개별)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredReports.map((report) => (
                <tr 
                  key={report.id} 
                  className={`transition-colors ${selectedIds.includes(report.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                >
                  {/* 개별 선택 체크박스 */}
                  <td className="px-4 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(report.id)}
                      onChange={() => toggleSelect(report.id)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-black text-gray-900 dark:text-gray-100">#{report.id}</div>
                    <div className="text-[11px] text-gray-500 mt-1">{formatDate(report.created_at)}</div>
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-white bg-indigo-500 px-1.5 py-0.5 rounded">신고</span>
                      <span className="font-semibold">{report.reporter}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">대상</span>
                      <span className="font-bold text-red-500">{report.target}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800 dark:text-gray-200 mb-1">{report.reason}</div>
                    {report.content && (
                      <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-100 dark:border-gray-800 text-xs text-gray-500 line-clamp-2 italic mb-2">
                        "{report.content.replace(/<[^>]*>/g, '')}"
                      </div>
                    )}
                    {report.link && (
                      <a href={report.link} target="_blank" className="text-[11px] font-bold text-blue-600 hover:underline">
                        🔗 신고 접수된 페이지 열기
                      </a>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">{getStatusBadge(report.status)}</td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-center">
                      {report.status === "pending" ? (
                        <>
                          <button onClick={() => handleAction([report.id], 'resolved')} className="w-16 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-bold">정지</button>
                          <button onClick={() => handleAction([report.id], 'rejected')} className="w-16 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded text-xs font-bold">반려</button>
                        </>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-1 rounded border">처리됨</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredReports.length === 0 && (
          <div className="p-16 text-center text-gray-500 font-medium flex flex-col items-center">
            <Icons.Check />
            <p className="mt-2">조건에 맞는 신고 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
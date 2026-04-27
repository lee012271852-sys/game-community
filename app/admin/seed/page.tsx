"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";

// 스팀 장르명 -> 우리 사이트 Slug 변환기
const GENRE_MAP: Record<string, string> = {
  "Action": "action",
  "Adventure": "adventure",
  "RPG": "rpg",
  "Role-Playing": "rpg",
  "Strategy": "strategy",
  "Simulation": "simulation",
  "Indie": "indie",
  "Casual": "casual",
  "Sports": "sports",
  "Racing": "racing",
  "Massively Multiplayer": "mmo",
};

export default function SeedPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const addLog = (msg: string) => setLogs((prev) => [msg, ...prev]);

  const handleSyncAll = async () => {
    setLoading(true);
    setLogs([]);
    setProgress(0);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("관리자 로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    addLog("📥 DB에서 모든 게임 목록을 불러오는 중...");

    // 1. 모든 게임 가져오기
    const { data, error } = await supabase.from("games").select("*");
    
    // ⭐️ [에러 해결 핵심] 데이터를 'any' 타입으로 강제 변환해서 TS 에러 무시
    const allGames: any[] = data || [];

    if (error || !allGames) {
      addLog("❌ 게임 목록 불러오기 실패: " + error?.message);
      setLoading(false);
      return;
    }

    addLog(`🎮 총 ${allGames.length}개의 게임 발견. 업데이트 시작...`);

    let successCount = 0;

    for (let i = 0; i < allGames.length; i++) {
      // game 변수도 any 타입으로 처리됨
      const game = allGames[i];
      setProgress(Math.round(((i + 1) / allGames.length) * 100));

      // 이미지 URL이 없으면 스킵
      if (!game.image_url) {
        addLog(`⚠️ [${game.title}] 이미지 URL 없음`);
        continue;
      }

      // 이미지 URL에서 App ID 추출 (정규식 사용)
      const appIdMatch = game.image_url.match(/\/apps\/(\d+)\//);
      
      if (!appIdMatch) {
        addLog(`⚠️ [${game.title}] 스팀 ID 찾기 실패 (URL 확인 필요)`);
        continue;
      }
      const appId = appIdMatch[1];

      try {
        const res = await fetch(`/api/steam-tags?appId=${appId}`);
        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        
        const data = await res.json();

        if (data[appId]?.success) {
          const gameData = data[appId].data;
          const steamGenres = gameData.genres || [];
          
          let newCategories = steamGenres.map((g: any) => {
            return GENRE_MAP[g.description] || g.description.toLowerCase().replace(/\s+/g, '-');
          });

          if (newCategories.length === 0) newCategories = ["indie"];

          // 중복 제거
          newCategories = [...new Set(newCategories)];

          const { error: updateError } = await supabase
            .from("games")
            .update({ categories: newCategories })
            .eq("id", game.id);

          if (updateError) throw updateError;
          addLog(`✅ [${game.title}] 태그 완료: ${newCategories.join(", ")}`);
          successCount++;
        } else {
          addLog(`⚠️ [${game.title}] 스팀 데이터 없음 (성인 게임이거나 지역락)`);
        }

      } catch (err: any) {
        addLog(`❌ [${game.title}] 실패: ${err.message}`);
      }
      
      // 스팀 API 제한 방지 (0.5초 대기)
      await new Promise(r => setTimeout(r, 500)); 
    }

    addLog(`🎉 작업 종료! 성공: ${successCount}건`);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-10 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">게임 태그 동기화</h1>
      
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
          <div className="bg-indigo-600 h-4 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>

        <button
          onClick={handleSyncAll}
          disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow disabled:bg-gray-400"
        >
          {loading ? `진행 중... (${progress}%)` : "전체 게임 태그 업데이트 시작"}
        </button>
      </div>

      <div className="bg-black text-green-400 p-6 rounded-xl font-mono text-xs h-96 overflow-y-auto border border-gray-800 shadow-inner">
        {logs.length === 0 ? "대기 중..." : logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
      </div>
    </div>
  );
}
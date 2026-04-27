"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";

// 🔄 변환 규칙 (왼쪽: 스팀에서 온 한글 / 오른쪽: 우리 사이트 영어 코드)
const TAG_MAP: Record<string, string> = {
  "액션": "action",
  "어드벤처": "adventure",
  "RPG": "rpg",
  "롤플레잉": "rpg",
  "전략": "strategy",
  "시뮬레이션": "simulation",
  "인디": "indie",
  "캐주얼": "casual",
  "스포츠": "sports",
  "레이싱": "racing",
  "대규모 멀티플레이어": "mmo",
  "MMORPG": "mmorpg",
  "공포": "horror",
  "생존": "survival",
  "오픈 월드": "open-world",
  "로그라이크": "roguelike",
  "퍼즐": "puzzle",
  "플랫포머": "platformer",
  "SF": "scifi",
  "판타지": "fantasy",
  "사이버펑크": "cyberpunk",
  "스토리 풍부": "story-rich",
  "협동": "co-op",
  "e스포츠": "esports",
  "FPS": "fps",
  "TPS": "tps",
  "슈팅": "shoot-em-up"
};

export default function FixTagsPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const addLog = (msg: string) => setLogs((prev) => [msg, ...prev]);

  const handleFixTags = async () => {
  // 🔐 보안 추가
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("관리자만 접근할 수 있습니다.");
    return;
  }
  
  setLoading(true);
    setLogs([]);
    setProgress(0);

    // 1. 모든 게임 가져오기
    const { data: games, error } = await supabase.from("games").select("*");
    
    // 타입 에러 방지용 any 변환
    const allGames: any[] = games || [];

    if (error || !allGames) {
      addLog("❌ 게임 불러오기 실패: " + error?.message);
      setLoading(false);
      return;
    }

    addLog(`🎮 총 ${allGames.length}개 게임의 태그 변환을 시작합니다...`);

    let count = 0;

    for (let i = 0; i < allGames.length; i++) {
      const game = allGames[i];
      setProgress(Math.round(((i + 1) / allGames.length) * 100));

      // 현재 태그 가져오기 (예: ["액션", "RPG"])
      const oldTags = game.categories || [];
      
      // 2. 변환 로직 실행
      let newTags: string[] = [];
      
      if (Array.isArray(oldTags)) {
        newTags = oldTags.map((tag: string) => {
          // 한글이면 맵핑된 영어로, 이미 영어면 그대로, 없으면 소문자로
          return TAG_MAP[tag] || tag.toLowerCase().replace(/\s+/g, '-');
        });
      }

      // 중복 제거 및 빈 값 제거
      newTags = [...new Set(newTags)].filter(t => t);

      // 태그가 하나도 없으면 'indie'라도 넣어줌
      if (newTags.length === 0) newTags = ["indie"];

      // 3. DB에 업데이트
      const { error: updateError } = await supabase
        .from("games")
        .update({ categories: newTags })
        .eq("id", game.id);

      if (updateError) {
        addLog(`❌ [${game.title}] 실패: ${updateError.message}`);
      } else {
        count++;
      }
    }

    addLog(`🎉 완료! 총 ${count}개 게임의 태그를 영어(slug)로 고쳤습니다.`);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-10 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">태그 한글 ➡️ 영어 변환기</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl mb-6">
        <p className="text-yellow-800 font-medium mb-2">💡 기능 설명</p>
        <p className="text-sm text-yellow-700">
          DB에 저장된 <b>"액션", "RPG"</b> 같은 한글 태그를<br/>
          사이트에서 사용하는 <b>"action", "rpg"</b> 같은 영어 코드로 변환합니다.<br/>
          (외부 API를 쓰지 않고 DB 내부 데이터만 수정하므로 안전합니다.)
        </p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden">
        <div className="bg-blue-600 h-4 transition-all duration-300" style={{ width: `${progress}%` }}></div>
      </div>

      <button
        onClick={handleFixTags}
        disabled={loading}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow disabled:bg-gray-400 transition-all"
      >
        {loading ? `변환 중... (${progress}%)` : "태그 변환 시작 (Start)"}
      </button>

      <div className="mt-8 bg-black text-green-400 p-6 rounded-xl font-mono text-xs h-80 overflow-y-auto">
        {logs.length === 0 ? "대기 중..." : logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import supabase from "@/lib/supabaseClient";

// 🔄 변환 규칙 (한글 -> 영어)
const TAG_MAP = {
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
  "공포": "horror",
  "생존": "survival",
  "오픈 월드": "open-world",
  "로그라이크": "roguelike",
  "스토리 풍부": "story-rich",
  "협동": "co-op",
  "FPS": "fps",
  "슈팅": "shoot-em-up"
};

export default function FixTagsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const addLog = (msg) => setLogs((prev) => [msg, ...prev]);

  const handleFixTags = async () => {
    // 🔐 최소한의 보안: 로그인 체크
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("관리자 로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setLogs([]);
    setProgress(0);

    // 1. 모든 게임 가져오기
    const { data: allGames, error } = await supabase.from("games").select("*");

    if (error || !allGames) {
      addLog("❌ 게임 불러오기 실패: " + error?.message);
      setLoading(false);
      return;
    }

    addLog(`🎮 총 ${allGames.length}개 게임 변환 시작...`);

    let count = 0;

    for (let i = 0; i < allGames.length; i++) {
      const game = allGames[i];
      setProgress(Math.round(((i + 1) / allGames.length) * 100));

      const oldTags = game.categories || [];
      let newTags = [];

      if (Array.isArray(oldTags)) {
        newTags = oldTags.map((tag) => {
          // 맵에 있으면 영어로, 없으면 소문자/공백처리
          return TAG_MAP[tag] || tag.toLowerCase().trim().replace(/\s+/g, '-');
        });
      }

      // 중복 및 빈값 제거
      newTags = [...new Set(newTags)].filter(t => t);
      if (newTags.length === 0) newTags = ["indie"];

      // 2. DB 업데이트
      const { error: updateError } = await supabase
        .from("games")
        .update({ categories: newTags })
        .eq("id", game.id);

      if (updateError) {
        addLog(`❌ [${game.title}] 실패: ${updateError.message}`);
      } else {
        count++;
      }
      
      // DB 부하 방지를 위해 아주 잠깐 쉬기 (선택사항)
      await new Promise(r => setTimeout(r, 100));
    }

    addLog(`🎉 완료! 총 ${count}개 업데이트 성공.`);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px' }}>
      <h1>태그 변환기 (JS)</h1>
      <div style={{ width: '100%', height: '10px', background: '#eee', marginBottom: '20px' }}>
        <div style={{ width: `${progress}%`, height: '100%', background: 'blue' }}></div>
      </div>
      <button 
        onClick={handleFixTags} 
        disabled={loading}
        style={{ width: '100%', padding: '15px', cursor: 'pointer' }}
      >
        {loading ? "작업 중..." : "변환 시작"}
      </button>
      <div style={{ marginTop: '20px', background: '#000', color: '#0f0', padding: '20px', height: '300px', overflowY: 'auto', fontSize: '12px' }}>
        {logs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    </div>
  );
}
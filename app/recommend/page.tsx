"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

const FONT_STYLE = {
  h1: "text-5xl lg:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500 uppercase italic leading-none",
  h2: "font-black tracking-tight text-foreground leading-tight",
  categoryLabel: "font-black text-[12px] text-primary uppercase tracking-[0.2em] mb-4 block opacity-90",
  body: "text-lg lg:text-xl font-medium leading-relaxed italic text-muted-foreground break-keep",
  actionButton: "font-black tracking-tighter uppercase text-[12px] transition-all"
};

const QUESTIONS = [
  { id: "playTime", label: "플레이 타임 (분량)", options: ["단판/단기 (3시간 미만)", "표준 볼륨 (15시간 내외)", "장기 몰입 (40시간 이상)"] },
  { id: "energy", label: "체감 난이도", options: ["쉬움 (부담없이 즐기기)", "보통 (적당한 도전)", "어려움 (난이도 있는 게임)", "하드코어"] },
  { id: "emotion", label: "선호하는 경험", options: ["힐링", "아드레날린과 쾌감", "긴장감, 공포", "지적인 능력"] },
  { id: "social", label: "사회적 상호작용", options: ["철저하게 혼자", "느슨한 연대/협동", "친구와 왁자지껄"] },
  { id: "aesthetic", label: "아트 스타일", options: ["사실적인 그래픽", "독창적인 카툰/동화", "레트로한 도트/픽셀"] }
];

export default function RecommendPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"logic" | "sentence">("logic");
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [userInput, setUserInput] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [conflictError, setConflictError] = useState("");

  // 상충 조건 실시간 검사 (단판+하드코어, 힐링+하드코어)
  useEffect(() => {
    if (mode === "logic") {
      const { playTime, energy, emotion } = selections;
      let error = "";

      if (playTime?.includes("단판/단기") && energy === "하드코어") {
        error = "⚠️ 짧은 '단판/단기' 플레이와 '하드코어' 난이도는 현실적으로 상충하는 조건입니다.";
      } else if (emotion === "힐링" && energy === "하드코어") {
        error = "⚠️ 안식을 찾는 '힐링'과 극한의 '하드코어'는 서로 정반대의 조건입니다.";
      }
      setConflictError(error);
    }
  }, [selections, mode]);

  const handleGetRecommendation = async (retry = false) => {
    if (conflictError) return;
    if (retry) setIsRefreshing(true);
    else { setIsLoading(true); setRecommendations([]); }
    
    try {
      const { data, error } = await supabase.functions.invoke("GameRecommend", {
        body: { mode, selections, userInput, isRetry: retry },
      });
      if (error) throw error;
      setRecommendations(data.recommendations);
    } catch (err) {
      alert("추천 정보를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const isAllSelected = QUESTIONS.every(q => selections[q.id]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans tracking-tight">
      <main className="max-w-5xl mx-auto px-4 py-16">
        
        <div className="text-center mb-16 space-y-4">
          <h1 className={FONT_STYLE.h1}>Discovery Engine</h1>
          <p className="text-muted-foreground font-bold">당신의 취향을 분석하여 최적의 게임 5개를 제안합니다.</p>
        </div>

        <div className="bg-card border border-border rounded-[3rem] p-10 sm:p-14 shadow-2xl mb-16 relative">
          <div className="flex p-1.5 bg-muted rounded-2xl mb-12 max-w-[280px] mx-auto border border-border">
            {(["logic", "sentence"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2.5 ${FONT_STYLE.actionButton} rounded-xl transition-all ${mode === m ? "bg-card shadow-sm text-primary" : "text-muted-foreground"}`}>
                {m === "logic" ? "맞춤 설정" : "자율 묘사"}
              </button>
            ))}
          </div>

          {mode === "logic" ? (
            <div className="space-y-12">
              {QUESTIONS.map((q) => (
                <div key={q.id} className="space-y-6">
                  <span className={FONT_STYLE.categoryLabel}>{q.label}</span>
                  <div className="flex flex-wrap gap-3">
                    {q.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setSelections(prev => ({ ...prev, [q.id]: opt }))}
                        className={`px-7 py-4 rounded-[1.25rem] text-sm font-bold transition-all border-2 ${selections[q.id] === opt ? "bg-primary border-primary text-primary-foreground shadow-lg scale-105" : "bg-muted/20 border-transparent hover:border-border text-muted-foreground"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {conflictError && (
                <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-[2rem] animate-in fade-in slide-in-from-top-2">
                  <p className="text-red-500 text-sm font-black text-center break-keep leading-relaxed">{conflictError}</p>
                </div>
              )}
            </div>
          ) : (
            <textarea value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="원하는 게임의 분위기나 특징을 자유롭게 묘사해주세요." className="w-full h-56 p-10 bg-muted/50 border-none rounded-[2.5rem] focus:ring-2 ring-primary transition-all text-lg font-bold leading-relaxed resize-none font-medium placeholder:text-muted-foreground/40" />
          )}

          <button 
            onClick={() => handleGetRecommendation(false)} 
            disabled={isLoading || !!conflictError || (mode === "logic" && !isAllSelected)} 
            className={`w-full mt-16 py-7 bg-primary text-primary-foreground ${FONT_STYLE.actionButton} rounded-[2.25rem] hover:scale-[1.01] active:scale-[0.98] transition-all shadow-xl shadow-primary/30 disabled:opacity-30 text-base`}
          >
            {isLoading ? "분석 중..." : "추천 리포트 생성"}
          </button>
        </div>

        {recommendations.length > 0 && !conflictError && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex items-center justify-between px-6 text-foreground">
              <h2 className="text-3xl font-black tracking-tighter uppercase italic">큐레이션 리포트</h2>
              <button onClick={() => handleGetRecommendation(true)} disabled={isRefreshing} className={`flex items-center gap-3 text-primary bg-primary/5 px-7 py-3.5 rounded-full border border-primary/20 hover:bg-primary/10 active:scale-95 disabled:opacity-50 ${FONT_STYLE.actionButton}`}>
                <div className={isRefreshing ? "animate-spin" : ""}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div>
                {isRefreshing ? "갱신 중..." : "다른 리스트 추천"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-14">
              {recommendations.map((game) => (
                <div key={game.id} className="group bg-card border border-border rounded-[4.5rem] overflow-hidden flex flex-col lg:flex-row hover:border-primary/40 transition-all duration-700 shadow-sm hover:shadow-2xl text-foreground">
                  <div className="w-full lg:w-[45%] h-80 lg:h-auto overflow-hidden">
                    <img src={game.image_url} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                  </div>
                  <div className="p-12 lg:p-16 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-8 gap-6">
                      <h3 className="text-3xl lg:text-4xl font-black tracking-tighter leading-tight break-keep">{game.title}</h3>
                      {game.metacritic && <div className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-2xl text-2xl font-black border border-emerald-500/20 font-sans">{game.metacritic}</div>}
                    </div>
                    <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed border-l-[6px] border-primary/30 pl-8 py-2 mb-12 italic font-medium break-keep">
                      {game.reason}
                    </p>
                    <div className="flex flex-wrap gap-5 mt-auto">
                      <button onClick={() => router.push(`/review/${game.id}`)} className={`px-10 py-5 bg-muted hover:bg-muted/80 ${FONT_STYLE.actionButton} rounded-2xl border border-border`}>상세 평론 보기</button>
                      <a href={game.purchase_url} target="_blank" rel="noopener noreferrer" className={`px-10 py-5 bg-primary text-primary-foreground ${FONT_STYLE.actionButton} rounded-2xl flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-105`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg> 지금 플레이하기
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
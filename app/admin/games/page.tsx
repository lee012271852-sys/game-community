"use client";

import { useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import { useToast } from "@/app/components/ToastProvider"; 

const Icons = {
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Plus: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  X: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Sparkles: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm12 9a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 18.8 8.412a1 1 0 01.587 1.685l-3.328 3.96 1.158 4.66a1 1 0 01-1.492 1.054L11.5 19.467l-4.225 2.304a1 1 0 01-1.492-1.054l1.158-4.66-3.328-3.96a1 1 0 01.587-1.685l4.654-1.212L9.033 2.744A1 1 0 0110 2z" /></svg>,
  Loader: () => <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  ImagePlaceholder: () => <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
};

const CATEGORY_OPTIONS = ["PC", "PS5", "Xbox", "Switch", "Mobile", "Action", "RPG", "FPS", "Adventure", "Simulation", "Indie"];

export default function AdminGamesPage() {
  const { triggerToast } = useToast(); 
  
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    image_url: "",
    categories: [] as string[],
    gameseed_score: 0,
    metacritic_score: 0,
    opencritic_score: 0,
    steam_appid: 0,
    release_date: "",
  });

  const fetchGames = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("games").select("*").order("created_at", { ascending: false });
    if (!error && data) setGames(data);
    setLoading(false);
  };

  useEffect(() => { fetchGames(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 게임을 DB에서 삭제하시겠습니까?")) return;
    
    const { error } = await supabase.from("games").delete().eq("id", id);
    if (!error) {
      triggerToast("🗑️ 게임이 삭제되었습니다.");
      fetchGames();
    } else {
      triggerToast("❌ 삭제 중 오류가 발생했습니다.");
    }
  };

  const openModal = (game: any = null) => {
    if (game) {
      setEditingGame(game);
      setFormData({
        title: game.title || "",
        description: game.description || "",
        content: game.content || "",
        image_url: game.image_url || "",
        categories: game.categories || [],
        gameseed_score: game.gameseed_score || 0,
        metacritic_score: game.metacritic_score || 0,
        opencritic_score: game.opencritic_score || 0,
        steam_appid: game.steam_appid || 0,
        release_date: game.release_date || "",
      });
    } else {
      setEditingGame(null);
      setFormData({ title: "", description: "", content: "", image_url: "", categories: [], gameseed_score: 0, metacritic_score: 0, opencritic_score: 0, steam_appid: 0, release_date: "" });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      release_date: formData.release_date || null
    };

    if (editingGame) {
      const { error } = await supabase.from("games").update(payload).eq("id", editingGame.id);
      if (error) {
        triggerToast("❌ 게임 수정에 실패했습니다.");
      } else {
        triggerToast("✅ 성공적으로 수정되었습니다!");
        setIsModalOpen(false);
        fetchGames();
      }
    } else {
      const { error } = await supabase.from("games").insert([payload]);
      if (error) {
        triggerToast("❌ 게임 등록에 실패했습니다.");
      } else {
        triggerToast("✨ 새 게임이 등록되었습니다!");
        setIsModalOpen(false);
        fetchGames();
      }
    }
    setIsSubmitting(false);
  };

  const handleApiFill = () => {
    setFormData({
      ...formData,
      title: "엘든 링 (Elden Ring)",
      description: "황금 나무의 파편을 모아 엘데의 왕이 되십시오.",
      content: "프롬 소프트웨어와 조지 R.R. 마틴이 합작한 오픈월드 다크 판타지 액션 RPG입니다...",
      image_url: "https://images.unsplash.com/photo-1605901309584-818e25960b8f",
      release_date: "2022-02-25",
      categories: ["PC", "PS5", "Xbox", "RPG", "Action"],
      gameseed_score: 9.8,
      metacritic_score: 96,
      opencritic_score: 95,
      steam_appid: 1245620
    });
    triggerToast("⚡ API에서 엘든 링 정보를 긁어왔습니다!");
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <main className="flex-1 flex flex-col overflow-hidden">
        
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-black">GameSeed Admin <span className="text-indigo-500 ml-2">DB Engine</span></h1>
          <button onClick={() => openModal()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
            <Icons.Plus /> 새 게임 등록
          </button>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="relative max-w-md mb-8">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icons.Search /></div>
            <input 
              type="text" 
              placeholder="게임 제목으로 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">게임 정보</th>
                    <th className="px-6 py-4 min-w-[200px]">카테고리</th>
                    <th className="px-6 py-4 text-center">출시일</th>
                    <th className="px-6 py-4 text-center">평점 (GS / 외부)</th>
                    <th className="px-6 py-4 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500"><Icons.Loader /> 데이터를 불러오는 중...</td></tr>
                  ) : games.filter(g => g.title?.includes(searchTerm)).length > 0 ? (
                    games.filter(g => g.title?.includes(searchTerm)).map((game) => (
                      <tr key={game.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">#{game.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0 flex justify-center items-center">
                              {game.image_url ? <img src={game.image_url} className="w-full h-full object-cover" alt="" /> : <Icons.ImagePlaceholder />}
                            </div>
                            <div className="max-w-[200px] sm:max-w-[300px]">
                              <p className="font-bold text-sm truncate">{game.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">{game.description || "설명 없음"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium">
                           <div className="flex gap-1 flex-wrap">
                             {game.categories?.map((c: string) => <span key={c} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] border border-slate-200 dark:border-slate-700">{c}</span>)}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-center text-xs text-slate-500 font-bold">{game.release_date || "-"}</td>
                        <td className="px-6 py-4 text-center">
                          {/* ⭐ 짙은 파랑색(bg-indigo-600)을 지우고 눈이 편안한 연한 뱃지 스타일로 통일 */}
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 text-xs font-black" title="GameSeed Score">
                              {game.gameseed_score || "0.0"}
                            </span>
                            <div className="flex items-center justify-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold" title="Metacritic">M {game.metacritic_score || 0}</span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold" title="OpenCritic">O {game.opencritic_score || 0}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => openModal(game)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"><Icons.Edit /></button>
                            <button onClick={() => handleDelete(game.id)} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"><Icons.Trash /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                     <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">검색된 게임이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
              <h2 className="text-lg font-black">{editingGame ? "게임 정보 수정" : "새 게임 등록"}</h2>
              <div className="flex items-center gap-4">
                <button type="button" onClick={handleApiFill} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-200 transition-colors">
                  <Icons.Sparkles /> API 자동완성
                </button>
                <button onClick={() => !isSubmitting && setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><Icons.X /></button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase">타이틀 <span className="text-rose-500">*</span></label>
                <input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} disabled={isSubmitting} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 disabled:opacity-50" placeholder="게임 제목을 입력하세요" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase">짧은 설명 (Description)</label>
                <input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} disabled={isSubmitting} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 disabled:opacity-50" placeholder="목록에 보여질 짧은 소개글" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase">이미지 URL</label>
                <div className="flex gap-4 items-start">
                  <input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} disabled={isSubmitting} className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 disabled:opacity-50" placeholder="https://..." />
                  
                  <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-inner">
                    {formData.image_url ? (
                       <img src={formData.image_url} alt="미리보기" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                    ) : (
                       <Icons.ImagePlaceholder />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase">출시일</label>
                <input type="date" value={formData.release_date} onChange={(e) => setFormData({...formData, release_date: e.target.value})} disabled={isSubmitting} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 disabled:opacity-50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase">Steam AppID (선택)</label>
                <input type="number" value={formData.steam_appid || ""} onChange={(e) => setFormData({...formData, steam_appid: Number(e.target.value)})} disabled={isSubmitting} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 disabled:opacity-50" placeholder="스팀 상점 고유 ID" />
              </div>

              {/* ⭐ 폼 안쪽에서도 튀는 배경색을 없애고 라벨 색상으로만 구분 */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-indigo-500 uppercase">GameSeed 점수 (0.0 ~ 10.0)</label>
                <input type="number" step="0.1" max="10" value={formData.gameseed_score || ""} onChange={(e) => setFormData({...formData, gameseed_score: Number(e.target.value)})} disabled={isSubmitting} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 disabled:opacity-50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-emerald-500 uppercase">메타스코어</label>
                <input type="number" max="100" value={formData.metacritic_score || ""} onChange={(e) => setFormData({...formData, metacritic_score: Number(e.target.value)})} disabled={isSubmitting} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500 disabled:opacity-50" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-amber-500 uppercase">오픈크리틱 점수</label>
                <input type="number" max="100" value={formData.opencritic_score || ""} onChange={(e) => setFormData({...formData, opencritic_score: Number(e.target.value)})} disabled={isSubmitting} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-amber-500 disabled:opacity-50" />
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="text-xs font-black text-slate-400 uppercase">카테고리 (플랫폼 & 장르)</label>
                <div className="flex gap-3 flex-wrap bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  {CATEGORY_OPTIONS.map(c => (
                    <label key={c} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={formData.categories.includes(c)} disabled={isSubmitting} onChange={(e) => {
                        const next = e.target.checked ? [...formData.categories, c] : formData.categories.filter(x => x !== c);
                        setFormData({...formData, categories: next});
                      }} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-500">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2 pb-6">
                <label className="text-xs font-black text-slate-400 uppercase">상세 내용 (Content)</label>
                <textarea rows={5} value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} disabled={isSubmitting} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 resize-none disabled:opacity-50" placeholder="게임 상세 소개 작성..." />
              </div>

              <div className="md:col-span-2 pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-2">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors disabled:opacity-50">취소</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100">
                  {isSubmitting ? (
                    <><Icons.Loader /> 저장 중...</>
                  ) : (
                    editingGame ? "변경 내용 저장" : "DB에 등록하기"
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
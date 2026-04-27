"use client";

import { useEffect, useState, useCallback } from "react";
import supabase from "../../lib/supabaseClient";
import { useRouter } from "next/navigation";

/** ⭐ 아이콘 객체 (기존 유지) */
const Icons = {
  Fire: () => <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.45-.412-1.725a1 1 0 00-1.734-.636 4.965 4.965 0 00-.73 2.193 4.996 4.996 0 005.152 5.567 5.002 5.002 0 004.97-5.32 8.783 8.783 0 00-.916-4.522 9.426 9.426 0 00-1.127-1.928c-.167-.23-.335-.43-.497-.587zM8 12a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" /></svg>,
  Message: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Heart: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  ChevronLeft: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  Image: () => <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
};

interface Post {
  id: number;
  title: string;
  content?: string;
  author: string;
  created_at: string;
  views: number;
  likes: number;
  comment_count: number;
  category: string;
  image_url?: string;
}

function timeAgo(dateString: string) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffInSeconds < 60) return "방금 전";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
  return past.toLocaleDateString();
}

const CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "free", label: "자유" },
  { id: "strategy", label: "공략" },
  { id: "question", label: "질문" },
  { id: "humor", label: "유머" },
];

const getCategoryBadgeStyle = (category: string) => {
  switch (category) {
    case "strategy": case "공략": return "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800";
    case "humor": case "유머": return "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800";
    case "question": case "질문": return "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-100 dark:border-green-800";
    default: return "bg-secondary text-secondary-foreground border-border";
  }
};

const getCategoryLabel = (category: string) => {
  const found = CATEGORIES.find(c => c.id === category);
  return found ? found.label : category;
};

// ⭐ 추천 수 5개 이상을 인기글로 분류
const POPULAR_THRESHOLD = 5; 

export default function CommunityPage() {
  const router = useRouter();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // 필터 및 검색 상태
  const [activeCategory, setActiveCategory] = useState("all");
  const [sort, setSort] = useState<"latest" | "likes" | "views">("latest");
  const [searchType, setSearchType] = useState("title_content");
  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  
  // ⭐ 인기글만 보기 토글 상태
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);
  
  // 페이징 상태
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 20;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("community")
        .select("*", { count: "exact" });

      if (activeCategory !== "all") {
        query = query.eq("category", activeCategory);
      }

      // ⭐ 인기글 필터링
      if (showOnlyPopular) {
        query = query.gte("likes", POPULAR_THRESHOLD);
      }

      if (appliedKeyword.trim()) {
        const term = `%${appliedKeyword}%`;
        if (searchType === "title_content") {
          query = query.or(`title.ilike.${term},content.ilike.${term}`);
        } else if (searchType === "title") {
          query = query.ilike("title", term);
        } else if (searchType === "content") {
          query = query.ilike("content", term);
        } else if (searchType === "nickname") {
          query = query.ilike("author", term);
        }
      }

      const sortColumn = sort === "likes" ? "likes" : sort === "views" ? "views" : "id";
      query = query.order(sortColumn, { ascending: false });

      const from = (currentPage - 1) * POSTS_PER_PAGE;
      const to = from + POSTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      
      setPosts(data as Post[]);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("게시글 로딩 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, sort, appliedKeyword, searchType, currentPage, showOnlyPopular]);

  const fetchPopularPosts = async () => {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const { data } = await supabase
      .from("community")
      .select("*")
      .gte("created_at", oneDayAgo.toISOString())
      .order("likes", { ascending: false })
      .limit(6);
    
    if (data) setPopularPosts(data as Post[]);
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchPopularPosts();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    setAppliedKeyword(keyword);
  };

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 상단 컨트롤 영역 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-muted-foreground hover:bg-accent border border-border"
                }`}
              >
                {cat.label}
              </button>
            ))}

            <div className="w-px h-4 bg-border mx-1 hidden sm:block"></div>
            
            <button
              onClick={() => { setShowOnlyPopular(!showOnlyPopular); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                showOnlyPopular
                  ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-500 shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-accent border-border"
              }`}
            >
              인기글
            </button>
          </div>

          <button
            onClick={() => router.push("/community/write")}
            className="flex-shrink-0 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Icons.Edit /> 새 글 쓰기
          </button>
        </div>

        {/* 실시간 인기글 박스 */}
        {popularPosts.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm mb-6 transition-colors">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <Icons.Fire />
              <h3 className="font-bold text-foreground text-sm tracking-tight">실시간 인기글</h3>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {popularPosts.map((post, idx) => (
                <li 
                  key={post.id} 
                  onClick={() => router.push(`/community/${post.id}`)}
                  className="flex gap-3 items-center cursor-pointer group rounded-lg hover:bg-muted/50 transition-colors py-1 px-1"
                >
                  <div className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-[11px] font-black ${
                    idx < 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <p className="text-sm font-bold text-foreground group-hover:text-primary truncate transition-colors">
                      {post.title}
                    </p>
                    {post.comment_count > 0 && (
                      <span className="text-[11px] font-black text-rose-500">
                        [{post.comment_count}]
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 게시글 목록 상단 필터바 */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
            전체 <span className="font-bold text-foreground">{totalCount.toLocaleString()}</span>개
            {showOnlyPopular && <span className="text-[10px] text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded font-bold">추천 {POPULAR_THRESHOLD}개 이상</span>}
          </div>
          <div className="flex gap-1 bg-secondary p-1 rounded-lg">
            {[{k:"latest",l:"최신"}, {k:"likes",l:"인기"}, {k:"views",l:"조회"}].map(o => (
              <button 
                key={o.k} 
                onClick={() => { setSort(o.k as any); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${sort === o.k ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        {/* 메인 게시글 리스트 */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-8 min-h-[500px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center p-40 gap-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-muted-foreground">목록을 불러오는 중...</p>
             </div>
          ) : posts.length > 0 ? (
            <ul className="divide-y divide-border">
              {posts.map((post) => (
                <li 
                  key={post.id} 
                  onClick={() => router.push(`/community/${post.id}`)}
                  className="group p-4 hover:bg-accent/40 transition-colors cursor-pointer flex items-center gap-4"
                >
                  {/* ⭐ 썸네일 박스는 무조건 유지하되, 이미지가 없으면 '...' 표시 */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border transition-colors hidden sm:block">
                    {post.image_url ? (
                      <img src={post.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/50">
                        {/* 디시인사이드 스타일의 텍스트 아이콘 (...) */}
                        <span className="text-xl font-black tracking-widest text-muted-foreground/40 mt-[-4px]">...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded border ${getCategoryBadgeStyle(post.category)}`}>
                        {getCategoryLabel(post.category)}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-medium">{post.author} · {timeAgo(post.created_at)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                        {post.title}
                      </h3>
                      {post.comment_count > 0 && (
                        <span className="text-[13px] font-black text-rose-500 flex-shrink-0">
                          [{post.comment_count}]
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-4 text-xs font-bold text-muted-foreground ml-2 hidden sm:flex">
                    <div className="flex flex-col items-center gap-0.5 min-w-[30px]">
                        <Icons.Heart /> 
                        <span className={`transition-colors ${post.likes >= POPULAR_THRESHOLD ? "text-orange-500" : "group-hover:text-foreground"}`}>
                          {post.likes}
                        </span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 min-w-[30px]">
                        <Icons.Eye />
                        <span className="group-hover:text-foreground transition-colors">{post.views}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-32 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-muted-foreground font-bold">조건에 맞는 게시글이 없습니다.</p>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1 mb-10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-20"
            >
              <Icons.ChevronLeft />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-9 h-9 rounded-lg text-sm font-black transition-all ${
                  currentPage === num ? "bg-primary text-primary-foreground shadow-lg scale-110" : "hover:bg-accent"
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-border hover:bg-accent disabled:opacity-20"
            >
              <Icons.ChevronRight />
            </button>
          </div>
        )}

        {/* 검색 영역 */}
        <div className="flex justify-center mb-10">
          <div className="flex bg-card border border-border rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden w-full max-w-md">
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
              className="bg-muted/50 border-r border-border text-xs font-black px-4 outline-none text-foreground"
            >
              <option value="title_content">전체</option>
              <option value="title">제목</option>
              <option value="nickname">작성자</option>
            </select>
            <input 
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="검색어를 입력하세요"
              className="px-4 py-3 text-sm outline-none flex-1 bg-transparent text-foreground"
            />
            <button onClick={handleSearch} className="px-5 bg-primary text-primary-foreground transition-colors">
              <Icons.Search />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
import Link from "next/link";
import Image from "next/image"; // ⭐ Next.js Image 추가
import { fetchGameMecaArticle } from "@/lib/gamemeca";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ url?: string }>;
};

const Icons = {
  ArrowLeft: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  ExternalLink: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
};

export default async function NewsDetailPage({ searchParams }: Props) {
  const { url } = await searchParams;

  // 에러 화면 1: 주소가 없을 때
  if (!url) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors">
        <div className="text-6xl mb-4 opacity-50">📰</div>
        <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">잘못된 접근입니다. 기사 주소가 없습니다.</p>
        <Link href="/news" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Icons.ArrowLeft /> 뉴스 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  let article;

  try {
    article = await fetchGameMecaArticle(url);
  } catch (error) {
    // 에러 화면 2: 크롤링 실패 시
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center transition-colors">
        <div className="text-6xl mb-4 opacity-50">⚠️</div>
        <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">원본 사이트의 응답이 지연되고 있습니다.</p>
        <Link href="/news" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2">
          <Icons.ArrowLeft /> 뉴스 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 transition-colors duration-300 pb-32">
      <main className="max-w-4xl mx-auto">
        
        <div className="mb-8">
          <Link href="/news" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
            <Icons.ArrowLeft /> Back to News
          </Link>
        </div>

        <article className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-12 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          
          <header className="mb-10 border-b border-slate-100 dark:border-slate-800 pb-8">
            <h1 className="text-3xl sm:text-4xl font-black leading-tight text-slate-800 dark:text-slate-100 break-keep mb-6">
              {article.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold mb-5">
              <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg uppercase tracking-wider">GameMeca</span>
              <span className="text-slate-400">{article.createdAt || "날짜 정보 없음"}</span>
            </div>

            {/* ⭐ 출처 명시 박스 */}
            <div className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 overflow-hidden">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1.5 flex-shrink-0">
                <Icons.ExternalLink /> 기사 원문 출처
              </span>
              <div className="h-px w-full sm:w-px sm:h-4 bg-slate-200 dark:bg-slate-700"></div>
              <a
                href={article.articleUrl}
                target="_blank"
                rel="noopener noreferrer" // ⭐ 보안 속성 필수 추가
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                title={article.articleUrl}
              >
                {article.articleUrl}
              </a>
            </div>
          </header>

          {/* ⭐ 썸네일 이미지 최적화 */}
          {article.imageUrl && (
            <div className="mb-10 relative w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-sm aspect-video">
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                priority // 메인 이미지이므로 렌더링 우선순위 부여
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover"
              />
            </div>
          )}


          {/* 본문 내용 출력 (Tailwind Typography 적용) */}
          <div
            className="prose prose-lg max-w-none 
            dark:prose-invert prose-slate 
            prose-img:rounded-3xl prose-img:shadow-md prose-img:w-full prose-img:object-cover
            prose-headings:font-black prose-headings:text-slate-800 dark:prose-headings:text-slate-100
            prose-a:text-indigo-600 hover:prose-a:text-indigo-700 prose-a:font-bold prose-a:no-underline
            prose-p:leading-loose prose-p:text-slate-600 dark:prose-p:text-slate-300"
            dangerouslySetInnerHTML={{ __html: article.bodyHtml }}
          />

        </article>
      </main>
    </div>
  );
}
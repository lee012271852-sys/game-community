"use client";

import { useState, useEffect, useRef } from "react";

const Icons = {
  Message: () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  X: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
  Send: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
};

export default function FloatingChat() {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // 초기 위치 설정 및 창 크기 변경 대응
  useEffect(() => {
    setPosition({ 
      x: window.innerWidth - 90, 
      y: window.innerHeight - 100 
    });
    setIsMounted(true);

    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 90),
        y: Math.min(prev.y, window.innerHeight - 100)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ⭐ 에러 없는 안전한 드래그 로직 (Pointer Events)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    // 마우스가 버튼을 벗어나도 드래그가 유지되도록 캡처
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return; // 좌클릭(또는 터치) 중일 때만 작동
    
    isDragging.current = true;
    let newX = e.clientX - dragStart.current.x;
    let newY = e.clientY - dragStart.current.y;

    // 화면 밖으로 나가지 않게 경계선 설정
    newX = Math.max(10, Math.min(newX, window.innerWidth - 70));
    newY = Math.max(10, Math.min(newY, window.innerHeight - 70));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleClick = () => {
    if (!isDragging.current) {
      setIsOpen(true);
    }
  };

  if (!isMounted) return null;

  return (
    <>
      {/* ⭐ 1. 배경 블러 처리 (열렸을 때만 화면 덮음) */}
      <div 
        className={`fixed inset-0 z-[998] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)} // 바깥을 누르면 닫힘
      ></div>

      {/* ⭐ 2. 오른쪽에서 슬라이드 되어 나오는 메신저 패널 */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] md:w-[450px] bg-background z-[999] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border bg-card shadow-sm z-10">
          <div>
            <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
              <span className="text-indigo-600"><Icons.Message /></span> 실시간 쪽지함
            </h2>
            <p className="text-xs font-bold text-muted-foreground mt-1">안 읽은 메시지 2개</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2.5 bg-muted hover:bg-accent text-muted-foreground rounded-full transition-colors active:scale-95"
          >
            <Icons.X />
          </button>
        </div>

        {/* 채팅 목록 영역 (스크롤 가능, 항상 가운데 차지) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5 bg-muted/10">
          
          <div className="bg-card border border-border p-4 rounded-3xl rounded-tl-sm w-[85%] shadow-sm">
            <p className="text-sm font-medium text-foreground leading-relaxed">안녕하세요! 리뷰 잘 봤습니다. 혹시 이 게임 패드 지원되나요?</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-2">익명 · 오후 2:30</p>
          </div>
          
          <div className="bg-indigo-600 text-white p-4 rounded-3xl rounded-tr-sm w-[85%] self-end shadow-sm">
            <p className="text-sm font-medium leading-relaxed">네! 엑박 패드 완벽 지원합니다 ㅎㅎ</p>
            <p className="text-[10px] font-bold text-indigo-200 mt-2 text-right">나 · 오후 2:35</p>
          </div>

        </div>

        {/* ⭐ 3. 입력창 (항상 하단에 고정) */}
        <div className="p-4 sm:p-6 border-t border-border bg-card">
          <div className="flex items-end gap-2 bg-muted p-2 rounded-3xl border border-border focus-within:ring-2 focus-within:ring-indigo-400 focus-within:border-indigo-400 transition-all shadow-inner">
            <textarea 
              rows={1}
              placeholder="메시지를 입력하세요..." 
              className="flex-1 bg-transparent border-none outline-none resize-none max-h-32 min-h-[44px] px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button className="w-11 h-11 flex-shrink-0 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all shadow-md mb-0.5 mr-0.5">
              <Icons.Send />
            </button>
          </div>
        </div>
      </div>

      {/* ⭐ 드래그 가능한 챗헤드 (쪽지함이 열리면 숨김) */}
      <div 
        style={{ 
          left: position.x, 
          top: position.y,
          visibility: isOpen ? 'hidden' : 'visible',
          opacity: isOpen ? 0 : 1,
          transition: isDragging.current ? 'none' : 'opacity 0.2s, transform 0.2s' 
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        className="fixed z-[997] w-16 h-16 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xl bg-indigo-600 text-white hover:scale-105 transition-transform touch-none"
      >
        <Icons.Message />
        
        {/* 안 읽은 알림 빨간 점 */}
        <div className="absolute top-0 right-0 w-4 h-4 bg-rose-500 border-2 border-indigo-600 rounded-full animate-bounce"></div>
      </div>
    </>
  );
}
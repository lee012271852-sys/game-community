"use client";

import { useEffect, useRef, useState } from "react";
import supabase from "../../../lib/supabaseClient"; // 경로에 맞게 수정
import { useRouter } from "next/navigation";

const CATEGORIES = [
  { id: "free", label: "자유" },
  { id: "strategy", label: "공략" },
  { id: "question", label: "질문" },
  { id: "humor", label: "유머" },
];

export default function WritePage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("free");
  
  // [주석 처리] 태그 및 익명 상태 변수
  // const [tags, setTags] = useState<string>("");
  // const [anonymous, setAnonymous] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0, visible: false });

  /* 로그인 체크 */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        alert("로그인이 필요합니다.");
        router.push("/auth/login");
      } else {
        setUser(data.session.user);
      }
    })();
  }, [router]);

  /* 에디터 내 이미지 클릭 시 삭제 팝업 */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const clickHandler = (e: any) => {
      if (e.target.tagName === "IMG") {
        const img = e.target as HTMLImageElement;
        setSelectedImage(img);
        const rect = img.getBoundingClientRect();
        setPopupPos({
          x: rect.right - 40,
          y: rect.bottom + window.scrollY,
          visible: true,
        });
      } else {
        setSelectedImage(null);
        setPopupPos((prev) => ({ ...prev, visible: false }));
      }
    };

    editor.addEventListener("click", clickHandler);
    return () => editor.removeEventListener("click", clickHandler);
  }, []);

  /* 파일 업로드 로직 */
  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    try {
      const datePrefix = new Date().getTime();
      const safeName = `${datePrefix}_${file.name.replace(/\s+/g, "_")}`;
      const filePath = `uploads/${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("community-images")
        .upload(filePath, file);

      if (uploadError) {
        alert("이미지 업로드 실패: " + uploadError.message);
        return null;
      }

      const { data } = supabase.storage
        .from("community-images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error(err);
      alert("이미지 업로드 중 오류가 발생했습니다.");
      return null;
    }
  };

  /* 에디터 명령어 실행 */
  const exec = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
  };

  /* 선택된 이미지 삭제 */
  const deleteSelectedImage = () => {
    if (!selectedImage) return;
    selectedImage.remove();
    setSelectedImage(null);
    setPopupPos({ ...popupPos, visible: false });
  };

  /* 글 저장 */
  const handleSubmit = async () => {
    const contentHTML = editorRef.current?.innerHTML || "";

    if (!title.trim() || !contentHTML.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoading(true);

    const insertPayload = {
      title,
      content: contentHTML,
      category,
      author: user.email, 
      user_id: user.id,
      image_url: extractFirstImage(contentHTML)
    };

    const { error } = await supabase.from("community").insert(insertPayload);

    setLoading(false);

    if (error) {
      console.error("작성 에러:", error);
      alert(`작성 실패! \n원인: ${error.message}`);
    } else {
      router.push("/community");
    }
  };

  const extractFirstImage = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const img = doc.querySelector("img");
    return img ? img.src : null;
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* 이모지가 제거된 심플한 헤더 */}
      <Header />

      <div className="max-w-5xl mx-auto px-6 py-8">
        
        {/* 카테고리 선택 영역 */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-muted-foreground mb-2">카테고리 선택</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  category === cat.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-muted-foreground border border-border hover:border-primary/50 hover:text-primary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 입력 */}
        <input
          className="w-full p-4 rounded-xl border border-border text-lg bg-card text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground transition-colors"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* 툴바 */}
        <Toolbar
          exec={exec}
          uploadFileToStorage={uploadFileToStorage}
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          deleteSelectedImage={deleteSelectedImage}
        />

        {/* 에디터 영역 */}
        <div className="bg-card border border-border rounded-xl shadow-sm mt-2 relative overflow-hidden min-h-[400px] transition-colors">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[400px] p-6 prose dark:prose-invert prose-slate max-w-none focus:outline-none prose-img:rounded-xl prose-img:shadow-sm"
            data-placeholder="내용을 입력하세요..."
          />
        </div>

        {/* 미리보기 영역 */}
        {previewOpen && (
          <div className="mt-6 bg-card border border-border p-6 rounded-xl shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-muted-foreground mb-4 border-b border-border pb-2">미리보기</h3>
            <div
              className="prose dark:prose-invert prose-slate max-w-none"
              dangerouslySetInnerHTML={{
                __html: editorRef.current?.innerHTML || "",
              }}
            />
          </div>
        )}

        {/* 하단 버튼 */}
        <div className="mt-6 flex justify-end gap-3">
           <button
             onClick={() => router.back()}
             className="px-6 py-3 rounded-xl text-muted-foreground font-bold hover:bg-accent transition-colors"
           >
             취소
           </button>
          <button
            className={`px-8 py-3 rounded-xl text-primary-foreground font-bold shadow-md transition-all ${
              loading 
                ? "bg-muted cursor-not-allowed text-muted-foreground" 
                : "bg-primary hover:bg-primary/90 active:scale-95"
            }`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>

      {/* 이미지 삭제 팝업 - 이모지 제거 */}
      {popupPos.visible && (
        <div
          className="fixed bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl z-50 cursor-pointer hover:bg-slate-800 transition-colors border border-white/10"
          style={{ top: popupPos.y + "px", left: popupPos.x + "px" }}
          onClick={deleteSelectedImage}
        >
          이미지 삭제
        </div>
      )}

      {/* 스타일 */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: var(--muted-foreground); 
          display: block;
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------
   HEADER COMPONENT
------------------------------------------------ */
function Header() {
  return (
    <header className="bg-card/50 backdrop-blur-sm border-b border-border transition-colors">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center">
        {/* ⭐ 이모지 제거 및 심플 텍스트 유지 */}
        <div className="text-lg font-extrabold text-foreground">
          새 글 작성
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------
   TOOLBAR COMPONENT
------------------------------------------------ */
function Toolbar({ exec, uploadFileToStorage, previewOpen, setPreviewOpen, deleteSelectedImage }: any) {
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    let isFired = false;
    input.onchange = async (e: any) => {
      if (isFired) return;
      isFired = true;
      const file = e.target.files?.[0];
      if (!file) return;
      setIsUploading(true);
      const url = await uploadFileToStorage(file);
      setIsUploading(false);
      if (!url) return;
      exec("insertHTML", `<img src="${url}" class="editor-image w-full rounded-xl my-4" />`);
      setShowImagePopup(false);
    };
    input.click();
  };

  const handleUrlInsert = () => {
    if (!imageUrlInput.trim()) {
      alert("이미지 주소를 입력해주세요.");
      return;
    }
    exec("insertHTML", `<img src="${imageUrlInput}" class="editor-image w-full rounded-xl my-4" />`);
    setImageUrlInput("");
    setShowImagePopup(false);
  };

  return (
    <div className="bg-card border border-border p-2 rounded-xl mt-4 mb-3 shadow-sm sticky top-16 z-30 transition-colors">
      <div className="flex flex-wrap gap-1 items-center relative">
        <ToolButton icon="B" label="굵게" onClick={() => exec("bold")} bold />
        <ToolButton icon="I" label="기울임" onClick={() => exec("italic")} italic />
        <ToolButton icon="U" label="밑줄" onClick={() => exec("underline")} underline />
        <ToolButton icon="S" label="취소선" onClick={() => exec("strikeThrough")} strike />
        
        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton icon="Left" label="왼쪽 정렬" onClick={() => exec("justifyLeft")} />
        <ToolButton icon="Center" label="가운데 정렬" onClick={() => exec("justifyCenter")} />
        
        <div className="w-px h-5 bg-border mx-1" />

        <ToolButton icon="• List" label="글머리" onClick={() => exec("insertUnorderedList")} />
        <ToolButton icon="1. List" label="번호" onClick={() => exec("insertOrderedList")} />

        <div className="w-px h-5 bg-border mx-1" />

        <div className="relative">
          <button
            className={`p-2 rounded hover:bg-accent transition-colors text-muted-foreground text-sm font-medium ${showImagePopup ? "bg-accent text-primary" : ""}`}
            title="이미지 추가"
            onClick={() => setShowImagePopup(!showImagePopup)}
          >
            사진
          </button>

          {showImagePopup && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-card border border-border rounded-xl shadow-xl p-4 z-50">
              <h4 className="text-xs font-bold text-muted-foreground mb-3">이미지 추가 방식</h4>
              
              <button
                onClick={handleFileUpload}
                disabled={isUploading}
                className="w-full flex items-center justify-center py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-bold mb-3"
              >
                {isUploading ? "업로드 중..." : "내 PC에서 업로드"}
              </button>

              <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink-0 mx-2 text-xs text-muted-foreground">OR</span>
                  <div className="flex-grow border-t border-border"></div>
              </div>

              <div className="mt-1">
                <input 
                  type="text" 
                  placeholder="https://..." 
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-xs mb-2 focus:outline-none focus:border-primary/50 text-foreground"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlInsert()}
                />
                <button 
                  onClick={handleUrlInsert}
                  className="w-full py-1.5 bg-foreground text-background rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  주소로 넣기
                </button>
              </div>
            </div>
          )}
        </div>


        <button
          className="ml-auto px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          onClick={() => setPreviewOpen((v: any) => !v)}
        >
          {previewOpen ? "닫기" : "미리보기"}
        </button>
      </div>
    </div>
  );
}

function ToolButton({ icon, label, onClick, bold, italic, underline, strike }: any) {
  return (
    <button
      className={`
        p-2 min-w-[32px] rounded hover:bg-accent transition-colors text-muted-foreground flex items-center justify-center text-sm font-medium
        ${bold ? "font-bold" : ""}
        ${italic ? "italic" : ""}
        ${underline ? "underline" : ""}
        ${strike ? "line-through" : ""}
      `}
      title={label}
      onClick={onClick}
    >
      {icon === "Left" && <AlignIcon type="left" />}
      {icon === "Center" && <AlignIcon type="center" />}
      {icon !== "Left" && icon !== "Center" ? icon : null}
    </button>
  );
}

function AlignIcon({ type }: { type: "left" | "center" }) {
  return (
    <div className={`flex flex-col gap-[2px] ${type === "center" ? "items-center" : "items-start"}`}>
      <span className="block w-3 h-[2px] bg-current opacity-70"></span>
      <span className="block w-2 h-[2px] bg-current opacity-70"></span>
      <span className="block w-3 h-[2px] bg-current opacity-70"></span>
    </div>
  );
}
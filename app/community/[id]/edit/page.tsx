"use client";

import { useEffect, useRef, useState } from "react";
import supabase from "../../../../lib/supabaseClient";
import { useRouter, useParams } from "next/navigation";

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const editorRef = useRef<HTMLDivElement | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("자유");
  const [tags, setTags] = useState<string>("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0, visible: false });

  const CATEGORIES = ["자유", "공지", "질문", "가이드", "잡담", "교류"];

  /* 로그인 */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);
    })();
  }, []);

  /* 글 데이터 불러오기 */
  useEffect(() => {
    if (!postId || postId === "undefined") return;

    (async () => {
      const { data, error } = await supabase
        .from("community")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) return;

      if (data) {
        setTitle(data.title);
        setCategory(data.category || "자유");
        setAnonymous(data.author === "익명");
        setTags(Array.isArray(data.tags) ? data.tags.join(", ") : "");
        if (editorRef.current) editorRef.current.innerHTML = data.content;
      }
    })();
  }, [postId]);

  /* 이미지 선택 팝업 */
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handler = (e: any) => {
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
        setPopupPos((p) => ({ ...p, visible: false }));
      }
    };

    editor.addEventListener("click", handler);
    return () => editor.removeEventListener("click", handler);
  }, []);

  /* 이미지 업로드 */
  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    const safeName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage
      .from("community-images")
      .upload(safeName, file);

    if (error) return null;

    const { data } = supabase.storage
      .from("community-images")
      .getPublicUrl(safeName);

    return data.publicUrl;
  };

  const insertImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await uploadFileToStorage(file);
      if (!url) return;
      exec("insertHTML", `<img src="${url}" class="editor-image w-full rounded-xl my-4" />`);
    };
    input.click();
  };

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const deleteSelectedImage = () => {
    if (!selectedImage) return;
    selectedImage.remove();
    setSelectedImage(null);
    setPopupPos({ ...popupPos, visible: false });
  };

  /* 수정하기 */
  const handleUpdate = async () => {
    const contentHTML = editorRef.current?.innerHTML || "";

    if (!title.trim() || !contentHTML.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    setLoading(true);

    const payload = {
      title,
      content: contentHTML,
      category,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      updated_at: new Date().toISOString(),
      author: anonymous ? "익명" : user?.email ?? "회원",
    };

    const { error } = await supabase
      .from("community")
      .update(payload)
      .eq("id", postId);

    setLoading(false);

    if (error) {
      alert("수정 실패");
    } else {
      alert("수정 완료");
      router.push(`/community/${postId}`);
    }
  };

  return (
    // ⭐ [수정] bg-background, text-foreground
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Header (다크 모드 대응) */}
      <div className="bg-card border-b border-border sticky top-0 z-40 transition-colors">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="text-2xl font-extrabold text-primary hover:text-primary/80 transition-colors">GameSeed</button>
            <div className="text-sm text-muted-foreground border-l border-border pl-4">커뮤니티 / 글 수정</div>
          </div>
          <button className="px-3 py-1.5 rounded bg-card border border-border text-sm font-medium hover:bg-accent transition-colors" onClick={() => router.back()}>
            취소
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* 제목 입력창 (bg-card) */}
        <input
          className="w-full p-4 rounded-xl border border-border text-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground transition-colors"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <select
            className="px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none transition-colors"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <input
            className="px-4 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors flex-1"
            placeholder="태그 (쉼표로 구분)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <label className="text-sm flex gap-2 items-center px-3 py-2 bg-card border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors">
            <input type="checkbox" className="accent-primary" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            <span className="text-muted-foreground font-medium">익명</span>
          </label>
        </div>

        {/* Toolbar */}
        <Toolbar
          exec={exec}
          insertImage={insertImage}
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          deleteSelectedImage={deleteSelectedImage}
        />

        {/* 에디터 영역 (prose-invert 추가) */}
        <div className="bg-card border border-border rounded-xl shadow-sm mt-2 relative overflow-hidden transition-colors">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[400px] p-6 prose dark:prose-invert max-w-none focus:outline-none"
          />
        </div>

        {previewOpen && (
          <div className="mt-6 bg-card border border-border p-6 rounded-xl shadow-sm transition-colors">
            <h3 className="text-sm font-bold text-muted-foreground mb-4 border-b border-border pb-2">미리보기</h3>
            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || "" }} />
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            className={`px-8 py-3 rounded-xl text-primary-foreground font-bold shadow-md transition-all ${loading ? "bg-muted text-muted-foreground" : "bg-primary hover:bg-primary/90 active:scale-95"}`}
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "수정 중..." : "수정하기"}
          </button>
        </div>
      </div>

      {/* 이미지 삭제 팝업 */}
      {popupPos.visible && (
        <div
          className="fixed bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl z-50 cursor-pointer hover:bg-slate-800 transition-colors border border-white/10"
          style={{ top: popupPos.y + "px", left: popupPos.x + "px" }}
          onClick={deleteSelectedImage}
        >
          🗑 이미지 삭제
        </div>
      )}
    </div>
  );
}

/* 다크 모드 통합 Toolbar */
function Toolbar({ exec, insertImage, previewOpen, setPreviewOpen, deleteSelectedImage }: any) {
  return (
    <div className="bg-card border border-border p-2 rounded-xl mt-4 mb-3 shadow-sm sticky top-20 z-30 transition-colors">
      <div className="flex flex-wrap gap-1 items-center">
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

        <button className="p-2 rounded hover:bg-accent text-muted-foreground transition-colors" title="이미지 삽입" onClick={insertImage}>
          🖼 사진
        </button>
        <button className="p-2 rounded hover:bg-accent text-muted-foreground transition-colors" title="선택 이미지 삭제" onClick={deleteSelectedImage}>
          🗑 삭제
        </button>

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
      className={`p-2 min-w-[32px] rounded hover:bg-accent transition-colors text-muted-foreground flex items-center justify-center ${bold ? "font-bold" : ""} ${italic ? "italic" : ""} ${underline ? "underline" : ""} ${strike ? "line-through" : ""}`}
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
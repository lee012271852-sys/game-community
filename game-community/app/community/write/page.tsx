"use client";

import { useEffect, useRef, useState } from "react";
import supabase from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function WritePage() {
  const router = useRouter();
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

  /* 로그인 체크 */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        alert("로그인이 필요합니다.");
        router.push("/auth");
      } else {
        setUser(data.session.user);
      }
    })();
  }, []);

  /* 이미지 클릭 팝업 */
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

  /* ✅ 수정됨 — 안전한 이미지 업로드 */
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

      // public URL 확보 (수정됨)
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

  /* 이미지 삽입 */
  const insertImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await uploadFileToStorage(file);
      if (!url) return;
      exec("insertHTML", `<img src="${url}" class="editor-image" />`);
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
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      author: anonymous ? "익명" : user.email,
      user_id: user.id,
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

  return (
    <div className="min-h-screen bg-[#F4F8FF]">
      <Header user={user} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <input
          className="w-full p-3 rounded border text-lg bg-white"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="mt-2 flex gap-3 items-center">
          <select
            className="px-2 py-1 border rounded bg-white text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input
            className="px-2 py-1 border rounded text-sm"
            placeholder="태그 (쉼표로 구분)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          <label className="text-sm flex gap-1 items-center">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            익명
          </label>
        </div>

        <Toolbar
          exec={exec}
          insertImage={insertImage}
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          deleteSelectedImage={deleteSelectedImage}
        />

        <div className="bg-white border rounded shadow-sm mt-2 relative">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[300px] p-4 prose max-w-none focus:outline-none"
          />
        </div>

        {previewOpen && (
          <div className="mt-4 bg-white border p-4 rounded shadow">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: editorRef.current?.innerHTML || "",
              }}
            />
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            className={`px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400" : "bg-sky-600"
            }`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>

      {popupPos.visible && (
        <div
          className="fixed bg-black bg-opacity-80 text-white text-sm px-3 py-2 rounded shadow-lg z-50 cursor-pointer"
          style={{ top: popupPos.y + "px", left: popupPos.x + "px" }}
          onClick={deleteSelectedImage}
        >
          🗑 삭제
        </div>
      )}

      <style jsx>{`
        .editor-image {
          max-width: 100%;
          border-radius: 10px;
          margin: 12px 0;
          cursor: pointer;
        }
        .editor-image:hover {
          opacity: 0.9;
          outline: 2px solid #3b82f6;
        }
      `}</style>
    </div>
  );
}

/* HEADER */
function Header({ user }: { user: any }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.push("/")} className="text-2xl font-extrabold text-indigo-600 hover:text-indigo-700">GameSeed</button>
          <div className="text-sm font-bold text-gray-500">글쓰기</div>
        </div>
        <button
          onClick={() => router.back()}
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 hover:bg-gray-200"
        >
          취소
        </button>
      </div>
    </header>
  );
}

/* TOOLBAR */
function Toolbar({ exec, insertImage, previewOpen, setPreviewOpen, deleteSelectedImage }: any) {
  return (
    <div className="bg-white border p-3 rounded mt-4 mb-3">
      <div className="flex flex-wrap gap-2 items-center">

        {/* Bold */}
        <button
          className="toolbar-btn font-bold text-lg"
          title="굵게"
          onClick={() => exec("bold")}
        >
          가
        </button>

        {/* Italic */}
        <button
          className="toolbar-btn italic text-lg"
          title="기울임"
          onClick={() => exec("italic")}
        >
          가
        </button>

        {/* Underline */}
        <button
          className="toolbar-btn text-lg underline"
          title="밑줄"
          onClick={() => exec("underline")}
        >
          가
        </button>

        {/* Strike */}
        <button
          className="toolbar-btn text-lg line-through"
          title="취소선"
          onClick={() => exec("strikeThrough")}
        >
          가
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        {/* Align left */}
        <button
          className="toolbar-btn"
          title="왼쪽 정렬"
          onClick={() => exec("justifyLeft")}
        >
          <div className="flex flex-col gap-[2px]">
            <span className="block w-4 h-[2px] bg-gray-700"></span>
            <span className="block w-3 h-[2px] bg-gray-700"></span>
            <span className="block w-5 h-[2px] bg-gray-700"></span>
          </div>
        </button>

        {/* Align center */}
        <button
          className="toolbar-btn"
          title="가운데 정렬"
          onClick={() => exec("justifyCenter")}
        >
          <div className="flex flex-col gap-[2px] items-center">
            <span className="block w-5 h-[2px] bg-gray-700"></span>
            <span className="block w-3 h-[2px] bg-gray-700"></span>
            <span className="block w-4 h-[2px] bg-gray-700"></span>
          </div>
        </button>

        {/* Align right */}
        <button
          className="toolbar-btn"
          title="오른쪽 정렬"
          onClick={() => exec("justifyRight")}
        >
          <div className="flex flex-col gap-[2px] items-end">
            <span className="block w-4 h-[2px] bg-gray-700"></span>
            <span className="block w-3 h-[2px] bg-gray-700"></span>
            <span className="block w-5 h-[2px] bg-gray-700"></span>
          </div>
        </button>

        {/* Unordered list */}
        <button
          className="toolbar-btn"
          title="글머리 기호"
          onClick={() => exec("insertUnorderedList")}
        >
          • 목록
        </button>

        {/* Ordered List */}
        <button
          className="toolbar-btn"
          title="번호 목록"
          onClick={() => exec("insertOrderedList")}
        >
          1. 목록
        </button>

        {/* Code block */}
        <button
          className="toolbar-btn font-mono text-xs"
          title="코드 삽입"
          onClick={() =>
            exec("insertHTML", "<pre class='bg-gray-100 p-2 rounded'>코드 입력</pre>")
          }
        >
          {"</>"}
        </button>

        {/* Insert image */}
        <button className="toolbar-btn" title="이미지 삽입" onClick={insertImage}>
          🖼
        </button>

        {/* Delete image */}
        <button className="toolbar-btn" title="선택 이미지 삭제" onClick={deleteSelectedImage}>
          🗑
        </button>

        {/* Preview toggle */}
        <button
          className="px-2 py-1 border rounded text-sm ml-auto"
          onClick={() => setPreviewOpen((v: any) => !v)}
        >
          {previewOpen ? "미리보기 닫기" : "미리보기"}
        </button>
      </div>

      <style jsx>{`
        .toolbar-btn {
          padding: 6px 8px;
          background: white;
          border: 1px solid #dee3ea;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          min-width: 32px;
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .toolbar-btn:hover {
          background: #eef2f8;
        }
      `}</style>
    </div>
  );
}


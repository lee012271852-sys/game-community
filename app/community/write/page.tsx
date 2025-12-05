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

  const CATEGORIES = ["자유", "공지", "질문", "가이드", "잡담", "교류"];

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);
    })();
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const onClick = (e: any) => {
      if (e.target.tagName === "IMG") {
        if (selectedImage) selectedImage.classList.remove("selected-editor-image");
        setSelectedImage(e.target);
        e.target.classList.add("selected-editor-image");
      } else {
        if (selectedImage) selectedImage.classList.remove("selected-editor-image");
        setSelectedImage(null);
      }
    };

    editor.addEventListener("click", onClick);
    return () => editor.removeEventListener("click", onClick);
  }, [selectedImage]);

  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from("community-images").upload(fileName, file);

    if (error) {
      alert("이미지 업로드 실패");
      return null;
    }

    const { data } = supabase.storage.from("community-images").getPublicUrl(fileName);
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

      exec("insertHTML", `<img src="${url}" alt="" class="editor-image" />`);
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
  };

  /* ★ 깨진 이미지 / alt="image" 제거 최적화 업데이트 */
  const cleanHTML = (html: string) => {
    let output = html;

    // 모든 alt 속성 제거
    output = output.replace(/alt="[^"]*"/gi, "");

    // src 없는 img 제거
    output = output.replace(/<img[^>]+src=["'][\s]*["'][^>]*>/gi, "");

    // undefined blob / broken URL 제거
    output = output.replace(/<img[^>]+src=["'][^"']*undefined[^"']*["'][^>]*>/gi, "");

    // 텍스트로 남은 'image' 제거
    output = output.replace(/\bimage\b/gi, "");

    // 빈 문단 제거
    output = output.replace(/<p>(\s|&nbsp;)*<\/p>/g, "");

    return output.trim();
  };

  const handleWrite = async () => {
    let contentHTML = editorRef.current?.innerHTML || "";
    contentHTML = cleanHTML(contentHTML);

    if (!title.trim() || !contentHTML.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoading(true);

    const payload = {
      title,
      content: contentHTML,
      category,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      created_at: new Date().toISOString(),
      author: anonymous ? "익명" : user.email,
      user_id: user.id,
    };

    const { error } = await supabase.from("community").insert(payload);

    setLoading(false);

    if (!error) {
      router.push("/community");
    } else {
      alert("작성 중 오류 발생");
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

        <div className="bg-white border rounded shadow-sm mt-2">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[300px] p-4 prose max-w-none"
            style={{ outline: "none" }}
          />
        </div>

        {previewOpen && (
          <div className="mt-4 bg-white border p-4 rounded shadow">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: cleanHTML(editorRef.current?.innerHTML || ""),
              }}
            />
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            className={`px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400" : "bg-sky-600"
            }`}
            onClick={handleWrite}
            disabled={loading}
          >
            {loading ? "작성 중..." : "작성하기"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .editor-image {
          max-width: 100%;
          border-radius: 10px;
          margin: 12px 0;
        }
        .selected-editor-image {
          outline: 3px solid #4dabff;
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
      <div className="relative max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="text-2xl font-extrabold text-indigo-600 hover:text-sky-600"
        >
          GameVerse
        </button>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => router.push("/mypage")}
                className="px-3 py-1.5 rounded-md text-sm bg-white/90"
              >
                내정보
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
                className="px-3 py-1.5 rounded-md text-sm bg-white/90"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/auth")}
                className="px-3 py-1.5 rounded-md text-sm bg-white/90"
              >
                로그인
              </button>
              <button
                onClick={() => router.push("/auth?mode=signup")}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-sky-600 text-white"
              >
                회원가입
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/* TOOLBAR */
function Toolbar({
  exec,
  insertImage,
  previewOpen,
  setPreviewOpen,
  deleteSelectedImage,
}: any) {
  return (
    <div className="bg-white border p-3 rounded mt-4 mb-3">
      <div className="flex flex-wrap gap-2 items-center">
        <button className="toolbar-btn font-bold" onClick={() => exec("bold")}>
          가
        </button>
        <button className="toolbar-btn italic" onClick={() => exec("italic")}>
          가
        </button>
        <button
          className="toolbar-btn"
          style={{ textDecoration: "underline" }}
          onClick={() => exec("underline")}
        >
          가
        </button>
        <button
          className="toolbar-btn"
          style={{ textDecoration: "line-through" }}
          onClick={() => exec("strikeThrough")}
        >
          가
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button className="toolbar-btn" onClick={() => exec("justifyLeft")}>
          L
        </button>
        <button className="toolbar-btn" onClick={() => exec("justifyCenter")}>
          C
        </button>
        <button className="toolbar-btn" onClick={() => exec("justifyRight")}>
          R
        </button>

        <button className="toolbar-btn" onClick={() => exec("insertUnorderedList")}>
          •
        </button>
        <button className="toolbar-btn" onClick={() => exec("insertOrderedList")}>
          1.
        </button>

        <button
          className="toolbar-btn"
          onClick={() =>
            exec("insertHTML", "<pre class='code-block'>코드 입력</pre>")
          }
        >
          {"</>"}
        </button>

        <button className="toolbar-btn" onClick={insertImage}>
          🖼
        </button>
        <button className="toolbar-btn" onClick={deleteSelectedImage}>
          🗑
        </button>

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
        }
        .toolbar-btn:hover {
          background: #eef2f8;
        }
      `}</style>
    </div>
  );
}

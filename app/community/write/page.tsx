"use client";

import { useEffect, useRef, useState } from "react";
import supabase from "../../../lib/supabaseClient";
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

  const CATEGORIES = ["자유", "공지", "질문", "가이드", "잡담", "교류"];

  /* ------------------------ 로그인 체크 ------------------------ */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);
    })();
  }, []);

  /* ------------------------ 기존 글 불러오기 ------------------------ */
  useEffect(() => {
    if (!postId) return;

    (async () => {
      const { data, error } = await supabase
        .from("community")
        .select("*")
        .eq("id", postId)
        .single();

      if (!error && data) {
        setTitle(data.title);
        setCategory(data.category);
        setAnonymous(data.author === "익명");
        setTags(data.tags?.join(", ") || "");
        if (editorRef.current) editorRef.current.innerHTML = data.content;
      }
    })();
  }, [postId]);

  /* ------------------------ 에디터 이미지 클릭 감지 ------------------------ */
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

  /* ------------------------ 이미지 업로드 ------------------------ */
  const uploadFileToStorage = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from("community-images").upload(fileName, file);

    if (error) {
      alert("이미지 업로드 실패");
      return null;
    }

    const { data } = supabase.storage
      .from("community-images")
      .getPublicUrl(fileName);

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

      exec("insertHTML", `<img src="${url}" class="editor-image" />`);
    };

    input.click();
  };

  /* ------------------------ execCommand ------------------------ */
  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  /* ------------------------ 이미지 삭제 ------------------------ */
  const deleteSelectedImage = () => {
    if (!selectedImage) return;
    selectedImage.remove();
    setSelectedImage(null);
  };

  /* ------------------------ 글 수정 저장 ------------------------ */
  const handleUpdate = async () => {
    const contentHTML = editorRef.current?.innerHTML || "";

    if (!title.trim() || !contentHTML.trim()) {
      alert("제목과 내용을 입력하세요.");
      return;
    }

    setLoading(true);

    const updatePayload = {
      title,
      content: contentHTML,
      category,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      updated_at: new Date().toISOString(),
      author: anonymous ? "익명" : user?.email ?? "회원",
    };

    const { error } = await supabase
      .from("community")
      .update(updatePayload)
      .eq("id", postId);

    setLoading(false);

    if (!error) {
      router.push(`/community/${postId}`);
    } else {
      alert("수정 중 오류 발생");
    }
  };

  /* ------------------------ UI ------------------------ */
  return (
    <div className="min-h-screen bg-[#F4F8FF]">

      {/* ---------------- 헤더 (메인 페이지와 완전히 동일) ---------------- */}
      <Header user={user} />

      {/* ---------------- 본문 ---------------- */}
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* 제목 */}
        <input
          className="w-full p-3 rounded border text-lg bg-white"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* 옵션 */}
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
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
            익명
          </label>
        </div>

        {/* 툴바 */}
        <Toolbar
          exec={exec}
          insertImage={insertImage}
          previewOpen={previewOpen}
          setPreviewOpen={setPreviewOpen}
          deleteSelectedImage={deleteSelectedImage}
        />

        {/* 에디터 */}
        <div className="bg-white border rounded shadow-sm mt-2">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="min-h-[300px] p-4 prose max-w-none"
            style={{ outline: "none" }}
          />
        </div>

        {/* Preview */}
        {previewOpen && (
          <div className="mt-4 bg-white border p-4 rounded shadow">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || "" }}
            />
          </div>
        )}

        {/* bottom submit */}
        <div className="mt-4 flex justify-end">
          <button
            className={`px-4 py-2 rounded text-white ${loading ? "bg-gray-400" : "bg-sky-600"}`}
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? "수정 중..." : "수정하기"}
          </button>
        </div>
      </div>

      {/* 스타일 */}
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

/* ============================ HEADER COMPONENT ============================ */

function Header({ user }: { user: any }) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/")}
            className="text-2xl font-extrabold text-indigo-600 hover:text-sky-600"
          >
            GameVerse
          </button>

          {/* NAV */}
          <nav className="hidden md:flex gap-4 text-sm text-gray-700">
            <button onClick={() => router.push("/review")} className="px-2 py-1 rounded-md hover:bg-white">
              평론
            </button>
            <button onClick={() => router.push("/community")} className="px-2 py-1 rounded-md hover:bg-white">
              커뮤니티
            </button>
            <button onClick={() => router.push("/recommend")} className="px-2 py-1 rounded-md hover:bg-white">
              AI 추천
            </button>
            <button onClick={() => router.push("/news")} className="px-2 py-1 rounded-md hover:bg-white">
              뉴스
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <button
                onClick={() => router.push("/mypage")}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-white/90 hover:bg-white"
              >
                내정보
              </button>

              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-white/90 hover:bg-white"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => router.push("/auth")}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-white/90 hover:bg-white"
              >
                로그인
              </button>

              <button
                onClick={() => router.push("/auth?mode=signup")}
                className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm bg-sky-600 hover:bg-sky-700 text-white"
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

/* ============================ TOOLBAR COMPONENT ============================ */

function Toolbar({ exec, insertImage, previewOpen, setPreviewOpen, deleteSelectedImage }: any) {
  return (
    <div className="bg-white border p-3 rounded mt-4 mb-3">
      <div className="flex flex-wrap gap-2 items-center">

        <button className="toolbar-btn" onClick={() => exec("bold")}>B</button>
        <button className="toolbar-btn" onClick={() => exec("italic")}>I</button>
        <button className="toolbar-btn" onClick={() => exec("underline")}>U</button>
        <button className="toolbar-btn" onClick={() => exec("strikeThrough")}>S</button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button className="toolbar-btn" onClick={() => exec("justifyLeft")}>L</button>
        <button className="toolbar-btn" onClick={() => exec("justifyCenter")}>C</button>
        <button className="toolbar-btn" onClick={() => exec("justifyRight")}>R</button>

        <button className="toolbar-btn" onClick={() => exec("insertUnorderedList")}>•</button>
        <button className="toolbar-btn" onClick={() => exec("insertOrderedList")}>1.</button>

        <button className="toolbar-btn" onClick={() => exec("insertHTML", "<pre class='code-block'>코드 입력</pre>")}>
          {"</>"}
        </button>

        <button className="toolbar-btn" onClick={insertImage}>🖼</button>

        <button className="toolbar-btn" onClick={deleteSelectedImage}>🗑</button>

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
        }
        .toolbar-btn:hover {
          background: #eef2f8;
        }
      `}</style>
    </div>
  );
}

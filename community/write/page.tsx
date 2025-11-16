"use client";

import { useState } from "react";
import supabase from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);

    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  // 파일 이름 안전하게 변환
  const sanitizeFileName = (name: string) =>
    name.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");

  const uploadImage = async (): Promise<string | null> => {
    if (!image) return null;

    const safeFileName = `${Date.now()}-${sanitizeFileName(image.name)}`;

    const { data, error } = await supabase.storage
      .from("community-images")
      .upload(safeFileName, image);

    if (error) {
      console.error("Storage Upload Error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("community-images")
      .getPublicUrl(safeFileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert("제목과 내용을 입력해주세요.");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      alert("로그인이 필요합니다.");
      setLoading(false);
      return;
    }

    const imageUrl = image ? await uploadImage() : null;

    const { error } = await supabase.from("community").insert({
      title,
      content,
      author: user.email ?? "익명",
      user_id: user.id,
      image_url: imageUrl ?? null,
      views: 0,
      likes: 0,
      comment_count: 0,
    });

    setLoading(false);

    if (!error) router.push("/community");
    else console.error("Insert Error:", error);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">글쓰기</h1>

      <input
        className="w-full border p-2 rounded mb-3"
        placeholder="제목을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full border p-2 rounded mb-3 h-40"
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="mb-2"
      />

      {preview && (
        <div className="mb-4">
          <img src={preview} alt="Preview" className="w-full rounded" />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className={`px-4 py-2 rounded text-white ${
          loading ? "bg-gray-400" : "bg-blue-500"
        }`}
      >
        {loading ? "등록 중..." : "등록하기"}
      </button>
    </div>
  );
}

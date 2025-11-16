"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import supabase from "../../../../lib/supabaseClient";

export default function EditPage() {
  const { id } = useParams();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("community")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setTitle(data.title);
      setContent(data.content);
      setExistingImageUrl(data.image_url);
    }
  };

  const sanitizeFileName = (name: string) =>
    name.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");

  const uploadImage = async () => {
    if (!image) return existingImageUrl;

    const safeFileName = `${Date.now()}-${sanitizeFileName(image.name)}`;

    const { data, error } = await supabase.storage
      .from("community-images")
      .upload(safeFileName, image);

    if (error) {
      console.error(error);
      return existingImageUrl;
    }

    const { data: urlData } = supabase.storage
      .from("community-images")
      .getPublicUrl(safeFileName);

    return urlData.publicUrl;
  };

  const updatePost = async () => {
    const imageUrl = await uploadImage();

    const { error } = await supabase
      .from("community")
      .update({
        title,
        content,
        image_url: imageUrl,
      })
      .eq("id", id);

    if (!error) router.push(`/community/${id}`);
  };

  useEffect(() => {
    fetchPost();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* ← 상세보기 버튼 */}
    <button
      className="mb-4 text-blue-500"
      onClick={() => router.push(`/community/${id}`)}
    >
    ← 게시글로 돌아가기
    </button>


      <h1 className="text-2xl font-bold mb-4">게시글 수정</h1>

      <input
        className="w-full border p-2 rounded mb-3"
        placeholder="제목"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full border p-2 rounded mb-3 h-40"
        placeholder="내용"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {existingImageUrl && (
        <img src={existingImageUrl} alt="image" className="w-full rounded mb-3" />
      )}

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImage(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <button
        onClick={updatePost}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        수정 완료
      </button>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase.config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Box, TextField, Button, Typography } from "@mui/material";
import Image from "next/image";

interface PostFormProps {
  userId: string;
  onPostAdded: () => void;
}

export default function PostForm({ userId, onPostAdded }: PostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Tạo preview khi file thay đổi
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Clean up memory khi unmount hoặc file thay đổi
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const handleSubmit = async () => {
    if (!file) return;

    // Upload ảnh lên Cloudinary
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "unsigned_preset");

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/dhmr88vva/image/upload",
      {
        method: "POST",
        body: formData,
      }
    );
    const data = await res.json();

    // Thêm post vào Firestore
    await addDoc(collection(db, "posts"), {
      authorId: userId,
      title,
      content,
      imageUrl: data.secure_url,
      createdAt: Date.now(),
      sent: false,
    });

    setTitle("");
    setContent("");
    setFile(null);
    onPostAdded(); // gọi callback để refresh danh sách
  };

  return (
    <Box sx={{ mb: 4, p: 2, bgcolor: "white", borderRadius: 2, boxShadow: 2 }}>
      <Typography variant="h5" gutterBottom>
        Thêm bài viết
      </Typography>
      <TextField
        label="Tiêu đề"
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        sx={{ mb: 2 }}
      />
      <TextField
        label="Nội dung"
        fullWidth
        multiline
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        sx={{ mb: 2 }}
      />
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      {preview && (
        <Box sx={{ mt: 2 }}>
          <Image
            src={preview}
            alt="Preview"
            width={300}
            height={300}
            style={{ borderRadius: 8, objectFit: "cover" }}
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
          />
        </Box>
      )}

      <Button variant="contained" sx={{ mt: 2 }} onClick={handleSubmit}>
        Đăng bài
      </Button>
    </Box>
  );
}

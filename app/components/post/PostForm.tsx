"use client";
import { useEffect, useRef, useState } from "react";
import { db } from "../../../lib/firebase.config";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Box, TextField, Button, Typography } from "@mui/material";
import Image from "next/image";
import { useUser } from "@/hooks/useUser";
import { toast } from "react-toastify";

interface PostFormProps {
  userId: string;
  onPostAdded: () => void;
}

export default function PostForm({ userId, onPostAdded }: PostFormProps) {
  const user = useUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    if (!user) return;

    if (user?.postsRemaining <= 0) {
      toast.error("Bạn đã hết lượt thêm bài viết.");
      return;
    }
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

    // 🔥 Trừ postsRemaining trong users
    const q = query(collection(db, "users"), where("email", "==", user.email));
    const snapshot = await getDocs(q);
    const userDoc = snapshot.docs[0];
    await updateDoc(doc(db, "users", userDoc.id), {
      postsRemaining: increment(-1),
    });

    toast.success("Thêm bài viết thành công!");

    setTitle("");
    setContent("");
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onPostAdded();
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
        ref={inputRef}
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

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase.config";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import {
  Box,
  Typography,
  Avatar,
  Divider,
  Paper,
  TextField,
  Button,
} from "@mui/material";
import { useUser } from "@/hooks/useUser";

interface Post {
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  authorId: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface Comment {
  id: string;
  text: string;
  userId: string; // email
  createdAt?: any;
  user?: User | null;
}

export default function PostDetail() {
  const { id: postId } = useParams<{ id: string }>();
  const user = useUser();
  const [post, setPost] = useState<Post | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");

  // 🔹 Hàm lấy user theo email
  const fetchUserByEmail = async (email: string): Promise<User | null> => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as User;
    }
    return null;
  };

  // 🔹 Lấy dữ liệu post + tác giả + comment
  useEffect(() => {
    const fetchData = async () => {
      if (!postId) return;

      // Post
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        const postData = postSnap.data() as Post;
        setPost({ ...postData, id: postSnap.id });

        // Tác giả
        if (postData.authorId) {
          const authorUser = await fetchUserByEmail(postData.authorId);
          if (authorUser) setAuthor(authorUser);
        }
      }

      // Comments
      const commentsSnap = await getDocs(
        query(
          collection(db, "posts", postId, "comments"),
          orderBy("createdAt", "desc")
        )
      );

      const commentsWithUser = await Promise.all(
        commentsSnap.docs.map(async (d) => {
          const data = d.data() as Comment;
          const user = await fetchUserByEmail(data.userId);
          return { ...data, id: d.id, user };
        })
      );

      setComments(commentsWithUser);
    };

    fetchData();
  }, [postId]);

  // 🔹 Gửi comment mới
  const handleAddComment = async () => {
    if (!text.trim() || !postId) return;

    await addDoc(collection(db, "posts", postId, "comments"), {
      text,
      userId: user?.email,
      createdAt: serverTimestamp(),
    });

    setText("");

    // Refresh comments
    const commentsSnap = await getDocs(
      query(
        collection(db, "posts", postId, "comments"),
        orderBy("createdAt", "desc")
      )
    );

    const commentsWithUser = await Promise.all(
      commentsSnap.docs.map(async (d) => {
        const data = d.data() as Comment;
        const u = await fetchUserByEmail(data.userId);
        return { ...data, id: d.id, user: u };
      })
    );

    setComments(commentsWithUser);
  };

  if (!post) return <Typography>Đang tải...</Typography>;

  return (
    <Box sx={{ py: 4, width: "100%" }}>
      <Paper
        sx={{
          p: 3,
          borderRadius: 3,
          width: "100%",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        {/* Tác giả */}
        {author && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Avatar src={author.avatar ?? ""} />
            <Box>
              <Typography variant="subtitle1">{author.username}</Typography>
              <Typography variant="body2" color="text.secondary">
                {author.email}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Tiêu đề */}
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {post.title}
        </Typography>

        {/* Nội dung */}
        <Typography variant="body1" sx={{ mb: 3 }}>
          {post.content ?? "Bài viết chưa có nội dung"}
        </Typography>

        {/* Ảnh */}
        {post.imageUrl && (
          <Box sx={{ maxWidth: 300, mx: "auto" }}>
            <img
              src={post.imageUrl}
              alt={post.title}
              style={{
                width: "100%", // chiếm toàn bộ chiều ngang khung cha
                height: "auto", // giữ đúng tỉ lệ gốc
                maxWidth: "100%", // không vượt quá khung cha
                borderRadius: "12px",
              }}
            />
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Bình luận */}
        <Typography variant="h6" gutterBottom>
          Bình luận 💬
        </Typography>

        <Box
          sx={{
            maxHeight: 200,
            overflowY: "auto",
            pr: 1,
            mb: 2,
          }}
        >
          {comments.length > 0 ? (
            comments.map((c) => {
              const date = c.createdAt?.toDate();
              return (
                <Box
                  key={c.id}
                  sx={{
                    mb: 2,
                    p: 1.5,
                    border: "1px solid #eee",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <Avatar
                      src={c.user?.avatar ?? ""}
                      sx={{ width: 28, height: 28 }}
                    />
                    <Box>
                      <Typography variant="subtitle2">
                        {c.user?.username ?? c.userId}
                      </Typography>
                      {date && (
                        <Typography variant="caption" color="text.secondary">
                          {date.toLocaleString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Typography variant="body2">{c.text}</Typography>
                </Box>
              );
            })
          ) : (
            <Typography variant="body2" color="text.secondary">
              Chưa có bình luận nào
            </Typography>
          )}
        </Box>

        {/* Form nhập bình luận */}
        {user && (
          <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
            {/* Avatar của user */}
            <Avatar src={user.avatar ?? ""} sx={{ width: 40, height: 40 }} />

            {/* Ô nhập bình luận + nút gửi */}
            <TextField
              fullWidth
              placeholder="Viết bình luận..."
              size="small"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Button variant="contained" onClick={handleAddComment}>
              Gửi
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

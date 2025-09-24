"use client";
import { useState } from "react";
import { db } from "../../../lib/firebase.config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Box, TextField, Button } from "@mui/material";

interface CommentBoxProps {
  postId: string;
  userId: string;
  onCommentAdded: () => void;
}

export default function CommentBox({
  postId,
  userId,
  onCommentAdded,
}: CommentBoxProps) {
  const [text, setText] = useState("");

  const handleAddComment = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "posts", postId, "comments"), {
      userId,
      text,
      createdAt: serverTimestamp(),
    });

    setText("");
    onCommentAdded();
  };

  return (
    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
      <TextField
        label="Viết bình luận..."
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <Button variant="outlined" onClick={handleAddComment}>
        Gửi
      </Button>
    </Box>
  );
}

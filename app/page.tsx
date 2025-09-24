"use client";
import { Box } from "@mui/material";
import PostForm from "./components/post/PostForm";
import PostList from "./components/post/PostList";
import { useUser } from "@/hooks/useUser";

export default function HomePage() {
  const user = useUser();
  const currentUserId = user?.email;

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: "auto" }}>
      <PostForm userId={currentUserId} onPostAdded={() => {}} />
      <PostList currentUserId={currentUserId} />
    </Box>
  );
}

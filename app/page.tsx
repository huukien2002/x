"use client";
import { Box } from "@mui/material";
import PostForm from "./components/post/PostForm";
import PostList from "./components/post/PostList";
import { useUser } from "@/hooks/useUser";
import { useState } from "react";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const user = useUser();
  const currentUserId = user?.email;

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: "auto" }}>
      <PostForm
        userId={currentUserId}
        onPostAdded={() => setRefreshKey((prev) => prev + 1)}
      />
      <PostList key={refreshKey} currentUserId={currentUserId} />
    </Box>
  );
}

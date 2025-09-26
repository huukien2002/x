"use client";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  InputBase,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";
import { deepPurple } from "@mui/material/colors";
import { Search, AddPhotoAlternate } from "@mui/icons-material";
import { useState } from "react";
import { useUser } from "@/hooks/useUser";
import PostForm from "./components/post/PostForm";
import PostList from "./components/post/PostList";
import Image from "next/image";

export default function HomePage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const user = useUser();
  const currentUserId = user?.email;

  return (
    <Box sx={{ bgcolor: "#f5f6fa", minHeight: "100vh" }}>
      {/* HEADER */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: "white",
          color: "black",
          borderBottom: "1px solid #eee",
        }}
      >
        <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
            <Image
              src="/favicon.ico" // nằm trong thư mục public
              alt="Logo"
              width={32}
              height={32}
            />
          </Box>
          <Paper
            sx={{
              display: "flex",
              alignItems: "center",
              px: 1,
              py: 0.5,
              borderRadius: 2,
              mr: 2,
              flexGrow: 2,
              maxWidth: 400,
            }}
          >
            <Search sx={{ color: "gray" }} />
            <InputBase
              placeholder="Tìm kiếm bài viết..."
              sx={{ ml: 1, flex: 1 }}
            />
          </Paper>
          <Avatar
            sx={{ bgcolor: deepPurple[500], width: 36, height: 36 }}
            src={user?.avatar}
          >
            {user?.username?.[0] || "U"}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* MAIN CONTENT */}
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          mt: 5,
          width: "100%",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 3, md: 10 },
          backgroundColor: "#f5f6fa",
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* LEFT SIDEBAR */}
        <Box
          sx={{
            flex: { xs: "none", md: "0 0 250px" },
            display: { xs: "none", md: "block" },
          }}
        >
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Trending Tags 🔥
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {["#ReactJS", "#NextJS", "#Firebase", "#Design"].map((tag) => (
                <Button key={tag} size="small" variant="outlined">
                  {tag}
                </Button>
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Gợi ý bạn bè 👥
            </Typography>
            {[1, 2, 3].map((i) => (
              <Box
                key={i}
                sx={{ display: "flex", alignItems: "center", mb: 2 }}
              >
                <Avatar sx={{ mr: 2 }} />
                <Typography>User {i}</Typography>
              </Box>
            ))}
          </Paper>
        </Box>

        {/* FEED */}
        <Box sx={{ flex: 1, maxWidth: { xs: "100%", md: 500 }, mx: "auto" }}>
          <PostForm
            userId={currentUserId}
            onPostAdded={() => setRefreshKey((prev) => prev + 1)}
          />

          <PostList refreshKey={refreshKey} currentUserId={currentUserId} />
        </Box>

        {/* RIGHT SIDEBAR */}
        <Box
          sx={{
            flex: { xs: "none", md: "0 0 250px" },
            mt: { xs: 3, md: 0 },
            display: { xs: "none", md: "block" }, // ẩn trên mobile
          }}
        >
          <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Top bài viết 📌
            </Typography>
            {[1, 2, 3].map((i) => (
              <Typography key={i} sx={{ mb: 1 }}>
                ⭐ Bài viết nổi bật {i}
              </Typography>
            ))}
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Banner
            </Typography>
            <Box
              sx={{
                bgcolor: "#eee",
                height: 150,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
              }}
            >
              Banner
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import DownloadIcon from "@mui/icons-material/Download";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import { useUser } from "@/hooks/useUser";

import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";

interface Post {
  id: string;
  title: string;
  thrilled: string;
  imageUrl: string;
  createdAt: number;
  sent: boolean;
  authorId: string;
  favorite: boolean;
}

const ProfilePage: React.FC = () => {
  const user = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [favoriteFilter, setFavoriteFilter] = useState<
    "all" | "favorite" | "notFavorite"
  >("all");

  const fetchUserPosts = async (email: string) => {
    setLoading(true);
    try {
      const postsRef = collection(db, "posts");
      const q = query(postsRef, where("authorId", "==", email));
      const snapshot = await getDocs(q);

      let data: Post[] = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          title: docData.title || "",
          thrilled: docData.content || "",
          imageUrl: docData.imageUrl || "",
          createdAt: Number(docData.createdAt) || Date.now(),
          sent: Boolean(docData.sent) || false,
          authorId: docData.authorId || "",
          favorite: docData.favorite ?? false,
        };
      });

      // Filter theo ngày nếu có
      if (startDate) {
        data = data.filter((p) => p.createdAt >= startDate.valueOf());
      }
      if (endDate) {
        data = data.filter((p) => p.createdAt <= endDate.valueOf());
      }

      if (favoriteFilter === "favorite") {
        data = data.filter((p) => p.favorite);
      } else if (favoriteFilter === "notFavorite") {
        data = data.filter((p) => !p.favorite);
      }

      data.sort((a, b) => b.createdAt - a.createdAt);

      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) fetchUserPosts(user.email);
  }, [user, startDate, endDate, favoriteFilter]);

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url, { mode: "cors" });
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = title || "image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const toggleFavorite = async (postId: string) => {
    try {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) {
        console.log("Document does not exist!");
        return;
      }

      const data = postSnap.data();
      const currentFavorite = data.favorite;

      await updateDoc(postRef, {
        favorite: currentFavorite === undefined ? true : !currentFavorite,
      });

      fetchUserPosts(user?.email);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  if (!user) return <Typography>Loading user...</Typography>;

  return (
    <Box
      sx={{
        maxWidth: 1000,
        margin: { xs: 0, sm: "0 auto" },
        mt: { xs: 2, sm: 4 },
        px: 2,
      }}
    >
      {/* Header User */}
      <Box display="flex" alignItems="center" mb={4}>
        <Avatar src={user.avatar} sx={{ width: 60, height: 60, mr: 2 }}>
          {user.username?.[0] || user.email[0]}
        </Avatar>
        <Box>
          <Typography variant="h5">{user.username || user.email}</Typography>
          <Typography variant="body2">{posts.length} posts</Typography>
        </Box>
      </Box>

      {/* Filter Date */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          display="flex"
          sx={{
            flexDirection: { xs: "column", sm: "row" },
          }}
          gap={2}
          mb={3}
        >
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            slotProps={{ textField: { variant: "outlined" } }}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            slotProps={{ textField: { variant: "outlined" } }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Favorite</InputLabel>
            <Select
              value={favoriteFilter}
              label="Favorite"
              /* eslint-disable @typescript-eslint/no-explicit-any */
              onChange={(e) => setFavoriteFilter(e.target.value as any)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="favorite">Favorite</MenuItem>
              <MenuItem value="notFavorite">Not Favorite</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            onClick={() => fetchUserPosts(user.email)}
          >
            Filter
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
              setFavoriteFilter("all");
              fetchUserPosts(user.email);
            }}
          >
            Clear
          </Button>
        </Box>
      </LocalizationProvider>

      {/* Collection */}
      {loading ? (
        <Typography>Loading posts...</Typography>
      ) : posts.length === 0 ? (
        <Typography sx={{ mt: 5 }}>No posts yet.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            mt: 5,
          }}
        >
          {posts.map((post) => (
            <Card
              key={post.id}
              sx={{
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.3s, box-shadow 0.3s",
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: 6,
                },
              }}
            >
              {post.imageUrl && (
                <Box
                  sx={{
                    width: "100%",
                    pt: "75%",
                    position: "relative",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={post.imageUrl}
                    alt={post.title}
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      display: "flex",
                      gap: 1,
                    }}
                  >
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        sx={{ bgcolor: "rgba(255,255,255,0.7)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(post.imageUrl, post.title);
                        }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Zoom">
                      <IconButton
                        size="small"
                        sx={{ bgcolor: "rgba(255,255,255,0.7)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomImage(post.imageUrl);
                        }}
                      >
                        <ZoomInIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={post.favorite ? "Favorite" : "UnFavorite"}>
                      <IconButton
                        size="small"
                        sx={{ bgcolor: "rgba(255,255,255,0.7)" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(post.id);
                        }}
                      >
                        <FavoriteIcon
                          fontSize="small"
                          color={post.favorite ? "error" : "inherit"}
                        />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              )}
              <CardContent>
                <Typography variant="h6">{post.title}</Typography>
                <Typography variant="body2" mb={1}>
                  {post.thrilled}
                </Typography>
                <Typography variant="caption">
                  {new Date(post.createdAt).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Lightbox */}
      <Dialog
        open={!!zoomImage}
        onClose={() => setZoomImage(null)}
        maxWidth="lg"
      >
        <DialogContent>
          <img
            src={zoomImage || ""}
            alt="Zoom"
            style={{ width: "100%", height: "auto" }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;

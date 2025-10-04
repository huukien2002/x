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
  Pagination,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
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
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { alpha } from "@mui/material/styles";

interface Post {
  id: string;
  title: string;
  thrilled: string;
  imageUrl: string;
  createdAt: number;
  sent: boolean;
  authorId: string;
  favorite: boolean;
  visible: boolean;
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

  const [visibleFilter, setVisibleFilter] = useState<
    "all" | "visible" | "notVisible"
  >("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 8;

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
          visible: docData.visible ?? false,
        };
      });

      // Filter theo ngày
      if (startDate)
        data = data.filter((p) => p.createdAt >= startDate.valueOf());
      if (endDate) data = data.filter((p) => p.createdAt <= endDate.valueOf());

      // Filter favorite
      if (favoriteFilter === "favorite") data = data.filter((p) => p.favorite);
      if (favoriteFilter === "notFavorite")
        data = data.filter((p) => !p.favorite);

      // Filter visible
      if (visibleFilter === "visible") data = data.filter((p) => p.visible);
      if (visibleFilter === "notVisible") data = data.filter((p) => !p.visible);

      data.sort((a, b) => b.createdAt - a.createdAt);
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      setCurrentPage(1); // reset page khi filter thay đổi
      fetchUserPosts(user.email);
    }
  }, [user, startDate, endDate, favoriteFilter, visibleFilter]);

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
      if (!postSnap.exists()) return;

      const currentFavorite = postSnap.data()?.favorite;
      await updateDoc(postRef, { favorite: !currentFavorite });

      fetchUserPosts(user?.email);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const toggleVisible = async (postId: string) => {
    try {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);

      if (!postSnap.exists()) return;

      const currentVisible = postSnap.data()?.visible;
      const newVisible = currentVisible === undefined ? false : !currentVisible;

      await updateDoc(postRef, { visible: newVisible });

      // Load lại danh sách posts
      fetchUserPosts(user?.email);
    } catch (error) {
      console.error("Error toggling visibility:", error);
    }
  };

  if (!user) return <Typography>Loading user...</Typography>;

  // Pagination logic
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = posts.slice(indexOfFirstPost, indexOfLastPost);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  return (
    <Box
      sx={{
        width: { xs: "100%", sm: "auto" },
        maxWidth: 1000,
        margin: { xs: 0, sm: "0 auto" },
        mt: { xs: 2, sm: 4 },
        px: 2,
        pb: 2,
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

      {/* Filter Date + Favorite */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          gap={2}
          mb={2}
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
              onChange={(e) => setFavoriteFilter(e.target.value as any)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="favorite">Favorite</MenuItem>
              <MenuItem value="notFavorite">Not Favorite</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Visible</InputLabel>
            <Select
              value={visibleFilter}
              label="Visible"
              onChange={(e) => setVisibleFilter(e.target.value as any)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="visible">Visible</MenuItem>
              <MenuItem value="notVisible">Not Visible</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box display="flex" gap={2} mb={4}>
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

      {/* Posts Grid */}
      {loading ? (
        <Typography>Loading posts...</Typography>
      ) : posts.length === 0 ? (
        <Typography sx={{ mt: 5 }}>No posts yet.</Typography>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: 2,
            }}
          >
            {currentPosts.map((post) => (
              <Card
                key={post.id}
                sx={{
                  position: "relative",
                  cursor: "pointer",
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": { transform: "translateY(-5px)", boxShadow: 6 },
                }}
              >
                {post.imageUrl && (
                  <Box sx={{ width: "100%", pt: "75%", position: "relative" }}>
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
                          sx={(theme) => ({
                            bgcolor: alpha(theme.palette.background.paper, 0.7),
                            "&:hover": {
                              bgcolor: alpha(
                                theme.palette.background.paper,
                                0.9
                              ),
                            },
                          })}
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
                          sx={(theme) => ({
                            bgcolor: alpha(theme.palette.background.paper, 0.7),
                            "&:hover": {
                              bgcolor: alpha(
                                theme.palette.background.paper,
                                0.9
                              ),
                            },
                          })}
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomImage(post.imageUrl);
                          }}
                        >
                          <ZoomInIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={post.favorite ? "Favorite" : "UnFavorite"}
                      >
                        <IconButton
                          size="small"
                          sx={(theme) => ({
                            bgcolor: alpha(theme.palette.background.paper, 0.7),
                            "&:hover": {
                              bgcolor: alpha(
                                theme.palette.background.paper,
                                0.9
                              ),
                            },
                          })}
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
                      <Tooltip
                        title={
                          post.visible !== false ? "Hide Post" : "Show Post"
                        }
                      >
                        <IconButton
                          size="small"
                          sx={(theme) => ({
                            bgcolor: alpha(theme.palette.background.paper, 0.7),
                            "&:hover": {
                              bgcolor: alpha(
                                theme.palette.background.paper,
                                0.9
                              ),
                            },
                          })}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVisible(post.id);
                          }}
                        >
                          {post.visible !== false ? (
                            <VisibilityIcon fontSize="small" />
                          ) : (
                            <VisibilityOffIcon fontSize="small" />
                          )}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <Box
              sx={{ mt: 3, pb: 3, display: "flex", justifyContent: "center" }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="large"
                variant="outlined"
              />
            </Box>
          )}
        </>
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

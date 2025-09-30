import {
  Card,
  CardHeader,
  Avatar,
  CardContent,
  Typography,
  Box,
  Divider,
  IconButton,
  Button,
} from "@mui/material";
import CommentBox from "./CommentBox";
import CommentList from "./CommentList";
import { useUser } from "@/hooks/useUser";
import { MoreVert, Share as ShareIcon } from "@mui/icons-material";
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import { useFacebookSDK } from "@/hooks/useFacebookSDK";

interface User {
  id: string;
  username: string;
  avatar: string;
}

interface Comment {
  id: string;
  text: string;
  user: User;
}

interface Post {
  id: string;
  title: string;
  thrilled: string;
  imageUrl: string;
  author: User;
  comments: Comment[];
  sent: boolean;
  createdAt: string | number; // timestamp hoặc string
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onRefresh: () => void;
}

export default function PostCard({
  post,
  currentUserId,
  onRefresh,
}: PostCardProps) {
  const user = useUser();
  useFacebookSDK();
  // Convert createdAt sang Date
  const createdDate =
    typeof post.createdAt === "number"
      ? new Date(post.createdAt)
      : new Date(post.createdAt);

  // const handleShare = () => {
  //   const url = `https://x-fe7d.vercel.app/posts/${post.id}`; // link thực tế tới bài viết
  //   const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
  //     url
  //   )}`;
  //   window.open(fbShareUrl, "_blank", "width=600,height=400");
  // };
  const handleShare = () => {
    const FB = (window as any).FB;

    if (!FB) {
      console.error("Facebook SDK chưa load xong");
      return;
    }

    FB.ui(
      {
        method: "share",
        href: `https://x-fe7d.vercel.app/posts/${post.id}`,
      },
      (response: any) => {
        if (response && !response.error_message) {
          console.log("✅ Share thành công");
          saveShareToFirestore();
        } else {
          console.log("❌ Share bị hủy hoặc lỗi", response);
        }
      }
    );
  };

  // Tách async riêng
  async function saveShareToFirestore() {
    // 1️⃣ Ghi log share riêng
    await addDoc(collection(db, "post_shares"), {
      postId: post.id,
      userId: currentUserId,
      createdAt: serverTimestamp(),
    });

    // 2️⃣ Cập nhật shareCount trong document post
    const postRef = doc(db, "posts", post.id);
    await updateDoc(postRef, {
      shareCount: increment(1),
    });
  }

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 2,
        boxShadow: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <CardHeader
        avatar={
          <Avatar
            src={post.author.avatar ?? ""}
            sx={{ width: 30, height: 30 }}
          />
        }
        title={
          <Typography fontWeight="bold" variant="body2">
            {post.author.username}
          </Typography>
        }
        subheader={
          <Typography variant="caption">
            {createdDate.toLocaleString()}
          </Typography>
        }
        action={
          <IconButton size="small">
            <MoreVert fontSize="small" />
          </IconButton>
        }
        sx={{ pb: 0 }}
      />

      {/* Title */}
      <Typography
        variant="subtitle1"
        px={2}
        pt={0.5}
        pb={0.5}
        fontWeight="bold"
        noWrap
      >
        {post.title}
      </Typography>

      {/* Image */}
      {post.imageUrl && (
        <Box px={2} mb={1}>
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{
              width: "100%",
              maxHeight: 300,
              objectFit: "cover",
              borderRadius: "8px",
            }}
          />
        </Box>
      )}

      <CardContent sx={{ pt: 0, pb: 1, flex: 1 }}>
        {/* Content */}
        <Typography
          sx={{ mb: 1, whiteSpace: "pre-line", fontSize: "0.85rem" }}
          noWrap
        >
          {post.thrilled}
        </Typography>

        {!post.sent && (
          <Typography variant="caption" color="error">
            (Not sent yet)
          </Typography>
        )}

        {/* Comments */}
        <Box>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Comments 💬
          </Typography>

          {/* Comment list (scroll riêng) */}
          <Box sx={{ maxHeight: 150, overflowY: "auto", paddingRight: 2 }}>
            <CommentList comments={post.comments} />
          </Box>

          {/* Comment form (luôn hiện) */}
          {user && (
            <Box mt={1}>
              <CommentBox
                postId={post.id}
                userId={currentUserId}
                onCommentAdded={onRefresh}
              />
            </Box>
          )}

          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              size="small"
              startIcon={<ShareIcon />}
              onClick={handleShare}
            >
              Share
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

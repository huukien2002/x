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
  shareCount: number;
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
  //   const FB = (window as any).FB;

  //   if (!FB) {
  //     console.error("Facebook SDK chưa load xong");
  //     return;
  //   }

  //   FB.ui(
  //     {
  //       method: "share",
  //       href: `https://x-fe7d.vercel.app/posts/${post.id}`,
  //     },
  //     () => {
  //       // Không check response nữa
  //       console.log("✅ Share popup đã mở, ghi nhận share");
  //       saveShareToFirestore();
  //     }
  //   );
  // };

  // // Tách async riêng
  // async function saveShareToFirestore() {
  //   const postRef = doc(db, "posts", post.id);
  //   await updateDoc(postRef, {
  //     shareCount: increment(1),
  //   });
  //   onRefresh()
  // }

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
        // ✅ callback sync
        if (response && !response.error_message) {
          console.log("✅ Share thành công");
          saveShareToFirestore(); // gọi async function nhưng không để async ở đây
        } else {
          console.log("❌ Share bị hủy hoặc lỗi", response);
        }
      }
    );
  };

  // Chỉ tăng +1, không reset
  async function saveShareToFirestore() {
    try {
      const postRef = doc(db, "posts", post.id);
      await updateDoc(postRef, {
        shareCount: increment(1),
      });
      onRefresh();
    } catch (err) {
      console.error("❌ Lỗi cập nhật shareCount:", err);
    }
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
              Share ({post.shareCount > 0 ? post.shareCount : 0})
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

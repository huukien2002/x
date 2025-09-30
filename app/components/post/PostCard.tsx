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
  Stack,
  Tooltip,
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
import PostReactions from "./PostReactions";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
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
      () => {
        // Không check response nữa
        console.log("✅ Share popup đã mở, ghi nhận share");
        saveShareToFirestore();
      }
    );
  };

  // Tách async riêng
  async function saveShareToFirestore() {
    const postRef = doc(db, "posts", post.id);
    await updateDoc(postRef, {
      shareCount: increment(1),
    });
    onRefresh();
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

        <Box>
          {/* Actions */}
          <Box
            mt={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            {/* Reactions */}
            {user && (
              <PostReactions post={post} currentUserId={currentUserId} />
            )}

            {/* Comment + Share */}
            <Stack direction="row" spacing={2} alignItems="center">
              {/* Comment */}
              <Stack direction="row" alignItems="center">
                <Tooltip title="Bình luận">
                  <IconButton
                    color="secondary"
                    sx={{
                      color: "black",
                      fontSize: "2rem",
                    }}
                  >
                    💬 <span style={{ fontSize: "0.75rem" }}>{post.comments.length > 0 && post.comments.length}</span>
                  </IconButton>
                </Tooltip>
              </Stack>

              {/* Share */}
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title="Chia sẻ bài viết">
                  <IconButton
                    color="primary"
                    onClick={handleShare}
                    sx={{
                      color: "black",
                      fontSize: "2rem",
                    }}
                  >
                    📤 <span style={{ fontSize: "0.75rem" }}> {post.shareCount > 0 && post.shareCount}</span>
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>

          {/* Comment list */}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ maxHeight: 150, overflowY: "auto", paddingRight: 2 }}>
            <CommentList comments={post.comments} />
          </Box>

          {/* Comment form  */}
          {user && (
            <Box mt={1}>
              <CommentBox
                postId={post.id}
                userId={currentUserId}
                onCommentAdded={onRefresh}
              />
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

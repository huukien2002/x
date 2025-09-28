import {
  Card,
  CardHeader,
  Avatar,
  CardContent,
  Typography,
  Box,
  Divider,
  IconButton,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import CommentBox from "./CommentBox";
import CommentList from "./CommentList";

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
  // Convert createdAt sang Date
  const createdDate =
    typeof post.createdAt === "number"
      ? new Date(post.createdAt)
      : new Date(post.createdAt);

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
          <Box mt={1}>
            <CommentBox
              postId={post.id}
              userId={currentUserId}
              onCommentAdded={onRefresh}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

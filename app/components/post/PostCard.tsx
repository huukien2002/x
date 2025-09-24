import {
  Card,
  CardHeader,
  Avatar,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import CommentBox from "./CommentBox";

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
    <Card sx={{ mb: 3 }}>
      <CardHeader
        avatar={<Avatar src={post.author.avatar ?? ""} />}
        title={post.author.username}
        subheader={createdDate.toLocaleString()}
      />

      <Typography variant="h6" px={2} mt={1}>
        {post.title}
      </Typography>

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt={post.title}
          style={{ width: "100%", maxHeight: 300, objectFit: "cover" }}
        />
      )}

      <CardContent>
        <Typography>{post.thrilled}</Typography>

        {!post.sent && (
          <Typography variant="caption" color="text.secondary">
            (Not sent yet)
          </Typography>
        )}

        {/* Comments */}
        <Box mt={2}>
          <Typography variant="h6">Comments</Typography>
          {post.comments.map((c) => (
            <Box key={c.id} display="flex" alignItems="center" mt={1}>
              <Avatar src={c.user.avatar ?? ""} sx={{ mr: 1 }} />
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {c.user.username}
                </Typography>
                <Typography variant="body2">{c.text}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Form comment */}
        <CommentBox
          postId={post.id}
          userId={currentUserId}
          onCommentAdded={onRefresh}
        />
      </CardContent>
    </Card>
  );
}

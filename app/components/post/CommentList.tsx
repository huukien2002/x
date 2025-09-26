import { useState } from "react";
import { Box, Avatar, Typography, Paper, Divider, Button } from "@mui/material";

export default function CommentList({ comments }: { comments: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Box>
      {/* Nút mở/đóng */}
      <Button
        variant="text"
        size="small"
        onClick={() => setOpen(!open)}
        sx={{ mb: 1, textTransform: "none" }}
      >
        {open ? "Ẩn bình luận" : `Xem ${comments.length} bình luận`}
      </Button>

      {open && (
        <Box>
          {comments.map((c, idx) => (
            <Box key={c.id} mb={2}>
              <Box display="flex" alignItems="flex-start">
                <Avatar src={c.user.avatar ?? ""} sx={{ mr: 2 }} />
                <Box
                  sx={{
                    bgcolor: "grey.100",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    flex: 1,
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    {c.user.username}
                  </Typography>
                  <Typography variant="body2">{c.text}</Typography>
                </Box>
              </Box>
              {idx < comments.length - 1 && <Divider sx={{ mt: 1 }} />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

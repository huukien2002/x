import { Box, Typography, Link, IconButton } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: 2,
        px: { xs: 2, sm: 4 },
        bgcolor: "primary.main",
        color: "white",
        textAlign: "center",
      }}
    >
      {/* Copyright */}
      <Typography variant="body2">
        © {new Date().getFullYear()} My Collection. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;

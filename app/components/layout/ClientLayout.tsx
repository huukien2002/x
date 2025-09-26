"use client"; // BẮT BUỘC để đánh dấu client component

import { Box } from "@mui/material";
import Header from "./Header";
import Footer from "./Footer";
import { ToastContainer } from "react-toastify";

interface Props {
  children: React.ReactNode;
}

const ClientLayout = ({ children }: Props) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      {/* children */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {children} {/* ChatPage */}
      </Box>

      <Footer />
    </Box>
  );
};

export default ClientLayout;

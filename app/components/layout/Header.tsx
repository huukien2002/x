"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

interface User {
  name: string;
  email: string;
}

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

  const loadUser = () => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  };

  useEffect(() => {
    loadUser(); // chạy lần đầu

    // lắng nghe cả storage (multi-tab) và custom event (same tab)
    window.addEventListener("storage", loadUser);
    window.addEventListener("userChanged", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("userChanged", loadUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    // 🔥 bắn custom event cho cùng tab
    window.dispatchEvent(new Event("userChanged"));
    router.push("/login");
    handleMenuClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const menuItems = user
    ? [
        { label: "Home", href: "/" },
        { label: "Profile", href: "/profile" },
        { label: "Checkout", href: "/checkout" },
        { label: "Chat", href: "/chat" },
        { label: "Logout", onClick: handleLogout },
      ]
    : [
        { label: "Home", href: "/" },
        { label: "Login", href: "/login" },
        { label: "Register", href: "/register" },
      ];

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" component="div">
          Collection
        </Typography>

        {/* Desktop menu */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
          {menuItems.map((item) =>
            item.href ? (
              <Button key={item.label} color="inherit" href={item.href}>
                {item.label}
              </Button>
            ) : (
              <Button key={item.label} color="inherit" onClick={item.onClick}>
                {item.label}
              </Button>
            )
          )}
        </Box>

        {/* Mobile menu */}
        <Box sx={{ display: { xs: "flex", md: "none" } }}>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {menuItems.map((item) =>
              item.href ? (
                <MenuItem
                  key={item.label}
                  onClick={handleMenuClose}
                  component="a"
                  href={item.href}
                >
                  {item.label}
                </MenuItem>
              ) : (
                <MenuItem key={item.label} onClick={item.onClick}>
                  {item.label}
                </MenuItem>
              )
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

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
  Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChatIcon from "@mui/icons-material/Chat";

// Firebase
import { ref, onValue, off } from "firebase/database";
import { rtdb } from "@/lib/firebase.config";

interface User {
  name: string;
  email: string;
}

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const router = useRouter();

  const loadUser = () => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  };

  useEffect(() => {
    loadUser();
    window.addEventListener("storage", loadUser);
    window.addEventListener("userChanged", loadUser);
    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("userChanged", loadUser);
    };
  }, []);

  // 🔹 Lắng nghe rooms để check unread
  useEffect(() => {
    if (!user?.email) return;

    const roomsRef = ref(rtdb, "rooms");
    const unsubscribe = onValue(roomsRef, (snap) => {
      const data = snap.val();
      if (!data) {
        setHasUnread(false);
        return;
      }

      const rooms = Object.values<any>(data);
      const found = rooms.some(
        (room: any) =>
          Array.isArray(room.unreadBy) &&
          room.unreadBy.includes(user.email)
      );
      setHasUnread(found);
    });

    return () => off(roomsRef);
  }, [user?.email]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
    router.push("/login");
    handleMenuClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const menuItems = user
    ? [
        { label: "Home", href: "/" },
        { label: "Profile", href: "/profile" },
        { label: "Checkout", href: "/checkout" },
        {
          label: "Chat",
          href: "/chat",
          icon: (
            <Badge
              color="error"
              variant="dot"
              invisible={!hasUnread}
              overlap="circular"
            >
              <ChatIcon />
            </Badge>
          ),
        },
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
          Blog
        </Typography>

        {/* Desktop menu */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 1 }}>
          {menuItems.map((item) =>
            item.href ? (
              <Button
                key={item.label}
                color="inherit"
                href={item.href}
                startIcon={item.icon}
              >
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
                  {item.icon}
                  <Typography sx={{ ml: 1 }}>{item.label}</Typography>
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

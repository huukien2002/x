"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  TextField,
  Button,
  Divider,
  Badge,
} from "@mui/material";
import { useUser } from "@/hooks/useUser";
import { db as fsDb, rtdb } from "@/lib/firebase.config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ref, get, set, push, onValue, off, update } from "firebase/database";

interface UserType {
  id: string; // uid trong Firestore
  email: string;
  username: string;
  avatar?: string | null;
}

interface MessageType {
  sender: string;
  text: string;
  createdAt: number;
}

export default function ChatPage() {
  const user = useUser();
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [text, setText] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 🔹 Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const fetchFriends = async () => {
      // 1. Lấy tất cả friendships có status=accepted mà mình là from hoặc to
      const q1 = query(
        collection(fsDb, "friendships"),
        where("status", "==", "accepted"),
        where("from", "==", user.email)
      );
      const q2 = query(
        collection(fsDb, "friendships"),
        where("status", "==", "accepted"),
        where("to", "==", user.email)
      );

      const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

      const friendEmails: string[] = [];

      snap1.forEach((doc) => {
        const data = doc.data() as any;
        friendEmails.push(data.to); // mình là from → bạn là to
      });
      snap2.forEach((doc) => {
        const data = doc.data() as any;
        friendEmails.push(data.from); // mình là to → bạn là from
      });

      // 2. Lấy user info theo email
      if (friendEmails.length > 0) {
        const chunks = [];
        for (let i = 0; i < friendEmails.length; i += 10) {
          chunks.push(friendEmails.slice(i, i + 10));
        }

        const allUsers: UserType[] = [];
        for (const chunk of chunks) {
          const qUsers = query(
            collection(fsDb, "users"),
            where("email", "in", chunk)
          );
          const usersSnap = await getDocs(qUsers);
          usersSnap.forEach((doc) => {
            allUsers.push({ id: doc.id, ...(doc.data() as any) });
          });
        }

        setUsers(allUsers);
      } else {
        setUsers([]);
      }
    };

    fetchFriends();
  }, [user]);

  // 🔹 Lắng nghe tin nhắn realtime
  useEffect(() => {
    if (!roomId) return;

    const chatRef = ref(rtdb, `chats/${roomId}`);
    const listener = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgs = Object.values(data) as MessageType[];
        setMessages(msgs.sort((a, b) => a.createdAt - b.createdAt));
      } else {
        setMessages([]);
      }
    });

    return () => {
      off(chatRef);
    };
  }, [roomId]);

  // 🔹 Khi chọn user để chat
  // const handleSelectUser = async (other: UserType) => {
  //   if (!user) return;
  //   setSelectedUser(other);

  //   // Check trong rooms xem có room giữa 2 email chưa
  //   const roomsRef = ref(rtdb, "rooms");
  //   const snapshot = await get(roomsRef);

  //   let existingRoomId: string | null = null;

  //   if (snapshot.exists()) {
  //     const allRooms = snapshot.val();
  //     for (const [rid, room] of Object.entries<any>(allRooms)) {
  //       if (
  //         (room.sender === user.email && room.receiver === other.email) ||
  //         (room.sender === other.email && room.receiver === user.email)
  //       ) {
  //         existingRoomId = rid;
  //         break;
  //       }
  //     }
  //   }

  //   if (existingRoomId) {
  //     setRoomId(existingRoomId);
  //   } else {
  //     // Tạo room mới
  //     const newRoomRef = push(roomsRef);
  //     await set(newRoomRef, {
  //       sender: user.email,
  //       receiver: other.email,
  //       createdAt: Date.now(),
  //     });
  //     setRoomId(newRoomRef.key);
  //   }
  // };

  // 🔹 Gửi tin nhắn
  // const handleSend = async () => {
  //   if (!user || !selectedUser || !roomId || !text.trim()) return;

  //   const msgRef = push(ref(rtdb, `chats/${roomId}`));
  //   await set(msgRef, {
  //     sender: user.email,
  //     text,
  //     createdAt: Date.now(),
  //   });

  //   // Cập nhật lastMessage trong rooms
  //   const roomRef = ref(rtdb, `rooms/${roomId}`);
  //   await update(roomRef, {
  //     lastMessage: text,
  //     lastSender: user.email,
  //     updatedAt: Date.now(),
  //   });

  //   setText("");
  // };

  // 🔹 Load danh sách user
  // useEffect(() => {
  //   if (!user) return;
  //   const fetchUsers = async () => {
  //     const snapshot = await getDocs(collection(fsDb, "users"));
  //     const list: UserType[] = [];
  //     snapshot.forEach((doc) => {
  //       /* eslint-disable @typescript-eslint/no-explicit-any */
  //       const data = doc.data() as any;
  //       if (data.email !== user.email) {
  //         list.push({ id: doc.id, ...data });
  //       }
  //     });
  //     setUsers(list);
  //   };
  //   fetchUsers();
  // }, [user]);

  const handleSelectUser = async (other: UserType) => {
    if (!user) return;
    setSelectedUser(other);

    const roomsRef = ref(rtdb, "rooms");
    const snapshot = await get(roomsRef);

    let existingRoomId: string | null = null;

    if (snapshot.exists()) {
      const allRooms = snapshot.val();
      for (const [rid, room] of Object.entries<any>(allRooms)) {
        if (
          (room.sender === user.email && room.receiver === other.email) ||
          (room.sender === other.email && room.receiver === user.email)
        ) {
          existingRoomId = rid;
          break;
        }
      }
    }

    if (existingRoomId) {
      setRoomId(existingRoomId);

      // 🔹 Đánh dấu đã đọc
      const roomRef = ref(rtdb, `rooms/${existingRoomId}`);
      const snap = await get(roomRef);
      if (snap.exists()) {
        const roomData = snap.val();
        const unreadBy: string[] = Array.isArray(roomData?.unreadBy)
          ? roomData.unreadBy
          : [];
        const newUnreadBy = unreadBy.filter((u) => u !== user.email);

        await update(roomRef, { unreadBy: newUnreadBy });
      }
    } else {
      // Tạo room mới
      const newRoomRef = push(roomsRef);
      await set(newRoomRef, {
        sender: user.email,
        receiver: other.email,
        createdAt: Date.now(),
        unreadBy: [], // luôn tạo mới có unreadBy
      });
      setRoomId(newRoomRef.key);
    }
  };
  // 🔹 Gửi tin nhắn
  const handleSend = async () => {
    if (!user || !selectedUser || !roomId || !text.trim()) return;

    const msgRef = push(ref(rtdb, `chats/${roomId}`));
    await set(msgRef, {
      sender: user.email,
      text,
      createdAt: Date.now(),
    });

    // Cập nhật lastMessage trong rooms
    const roomRef = ref(rtdb, `rooms/${roomId}`);
    const snap = await get(roomRef);
    const roomData = snap.val();

    // Nếu chưa có unreadBy thì tạo mảng mới
    let unreadBy: string[] = Array.isArray(roomData?.unreadBy)
      ? roomData.unreadBy
      : [];

    // Thêm receiver vào unreadBy nếu chưa có
    if (!unreadBy.includes(selectedUser.email)) {
      unreadBy.push(selectedUser.email);
    }

    await update(roomRef, {
      lastMessage: text,
      lastSender: user.email,
      updatedAt: Date.now(),
      unreadBy,
    });

    setText("");
  };

  useEffect(() => {
    const roomsRef = ref(rtdb, "rooms");
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allRooms = snapshot.val();
        const list = Object.entries(allRooms).map(([id, room]) => ({
          id,
          ...(room as any),
        }));
        setRooms(list);
      } else {
        setRooms([]);
      }
    });

    return () => off(roomsRef);
  }, []);

  const findRoomWithUser = (otherEmail: string) => {
    if (!user) return null;
    return rooms.find(
      (room) =>
        (room.sender === user.email && room.receiver === otherEmail) ||
        (room.sender === otherEmail && room.receiver === user.email)
    );
  };

  if (!user) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography>Please login</Typography>
      </Box>
    );
  }

  return (
    <div className="flex flex-col flex-1 sm:flex-row">
      <div className="md:w-1/4 w-full h-full border-r border-gray-300 flex flex-col">
        {/* Header */}
        <div className="h-[80px] flex items-center px-3 text-lg  border-b border-gray-300">
          Users
        </div>

        {/* Danh sách user scroll */}
        {/* <div className="h-[calc(100vh-200px)] overflow-y-auto">
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => handleSelectUser(u)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 ${
                selectedUser?.id === u.id ? "bg-gray-200" : ""
              }`}
            >
              <div className="w-15 h-15 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                {u.avatar ? (
                  <Avatar src={u.avatar || undefined}>{u.username?.[0]}</Avatar>
                ) : (
                  <span className="text-sm font-medium">{u.username?.[0]}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{u.username}</span>
                <span className="text-xs text-gray-500">{u.email}</span>
              </div>
            </button>
          ))}
        </div> */}

        <div className="h-[calc(100vh-200px)] overflow-y-auto">
          <List disablePadding>
            {users.map((u) => {
              const room = findRoomWithUser(u.email);
              const hasNew = room?.unreadBy?.includes(user.email);

              return (
                <ListItemButton
                  key={u.id}
                  selected={selectedUser?.id === u.id}
                  onClick={() => handleSelectUser(u)}
                  sx={{
                    "&.Mui-selected": {
                      backgroundColor: "action.selected",
                    },
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      variant="dot"
                      color="error"
                      invisible={!hasNew}
                      anchorOrigin={{ vertical: "top", horizontal: "right" }}
                      sx={{
                        "& .MuiBadge-dot": {
                          height: 15,
                          minWidth: 15,
                          borderRadius: "50%",
                          border: "2px solid white", // tạo viền trắng giống Messenger
                        },
                      }}
                    >
                      <Avatar src={u.avatar || undefined}>
                        {u.username?.[0]}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>

                  <ListItemText
                    primary={u.username}
                    secondary={u.email}
                    primaryTypographyProps={{
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                    secondaryTypographyProps={{
                      fontSize: "0.75rem",
                      color: "text.secondary",
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </div>
      </div>

      <div className="w-full md:w-3/4 h-full">
        {selectedUser ? (
          <>
            <Box p={2} borderBottom="1px solid #ccc">
              <Typography variant="h6">
                Chat with{" "}
                <span style={{ fontWeight: "bold", color: "#1976d2" }}>
                  {selectedUser.username}
                </span>
              </Typography>
            </Box>
            <div
              ref={scrollRef}
              className="h-[calc(100vh-250px)] overflow-y-scroll px-5 py-3"
            >
              {messages.map((msg, idx) => (
                <Box
                  key={idx}
                  display="flex"
                  flexDirection="column"
                  alignItems={
                    msg.sender === user?.email ? "flex-end" : "flex-start"
                  }
                  mb={0.5}
                >
                  <Box
                    p={1.2}
                    borderRadius={2}
                    bgcolor={
                      msg.sender === user?.email ? "primary.main" : "grey.200"
                    }
                    color={msg.sender === user?.email ? "white" : "black"}
                    maxWidth="70%"
                  >
                    <Typography variant="body1">{msg.text}</Typography>
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.65rem",
                      opacity: 0.6,
                      mt: 0.3,
                    }}
                  >
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </Typography>
                </Box>
              ))}
            </div>
            <Box p={2} display="flex" gap={1}>
              <TextField
                fullWidth
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                size="small"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button variant="contained" onClick={handleSend}>
                Send
              </Button>
            </Box>
          </>
        ) : (
          <Box
            flex={1}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Typography sx={{ mt: 2 }}>Select a user to chat</Typography>
          </Box>
        )}
      </div>
    </div>
  );
}

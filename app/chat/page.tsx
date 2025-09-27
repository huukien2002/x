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
} from "@mui/material";
import { useUser } from "@/hooks/useUser";
import { db as fsDb, rtdb } from "@/lib/firebase.config";
import { collection, getDocs } from "firebase/firestore";
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
  // 🔹 Load danh sách user
  useEffect(() => {
    if (!user) return;
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(fsDb, "users"));
      const list: UserType[] = [];
      snapshot.forEach((doc) => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const data = doc.data() as any;
        if (data.email !== user.email) {
          list.push({ id: doc.id, ...data });
        }
      });
      setUsers(list);
    };
    fetchUsers();
  }, [user]);

  // 🔹 Khi chọn user để chat
  const handleSelectUser = async (other: UserType) => {
    if (!user) return;
    setSelectedUser(other);

    // Check trong rooms xem có room giữa 2 email chưa
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
    } else {
      // Tạo room mới
      const newRoomRef = push(roomsRef);
      await set(newRoomRef, {
        sender: user.email,
        receiver: other.email,
        createdAt: Date.now(),
      });
      setRoomId(newRoomRef.key);
    }
  };

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
    await update(roomRef, {
      lastMessage: text,
      lastSender: user.email,
      updatedAt: Date.now(),
    });

    setText("");
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
      <div className=" md:w-1/4 border-r border-gray-300 h-full w-full">
        <Typography variant="h6" p={2}>
          Users
        </Typography>
        <Divider />
        <List>
          {users.map((u) => (
            <ListItemButton
              key={u.id}
              selected={selectedUser?.id === u.id}
              onClick={() => handleSelectUser(u)}
            >
              <ListItemAvatar>
                <Avatar src={u.avatar || undefined}>{u.username?.[0]}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={u.username} secondary={u.email} />
            </ListItemButton>
          ))}
        </List>
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
            <Typography>Select a user to chat</Typography>
          </Box>
        )}
      </div>
    </div>
    // <Box display={{ xs: "block", sm: "flex" }}>
    //   {/* Danh sách user */}
    // <Box width={{ xs: "100%", sm: "30%" }} borderRight="1px solid #ccc">
    //   <Typography variant="h6" p={2}>
    //     Users
    //   </Typography>
    //   <Divider />
    //   <List>
    //     {users.map((u) => (
    //       <ListItemButton
    //         key={u.id}
    //         selected={selectedUser?.id === u.id}
    //         onClick={() => handleSelectUser(u)}
    //       >
    //         <ListItemAvatar>
    //           <Avatar src={u.avatar || undefined}>{u.username?.[0]}</Avatar>
    //         </ListItemAvatar>
    //         <ListItemText primary={u.username} secondary={u.email} />
    //       </ListItemButton>
    //     ))}
    //   </List>
    // </Box>

    //   {/* Chat window */}
    // <Box flex={1} display="flex" flexDirection="column">
    //   {selectedUser ? (
    //     <>
    //       <Box p={2} borderBottom="1px solid #ccc">
    //         <Typography variant="h6">
    //           Chat with{" "}
    //           <span style={{ fontWeight: "bold", color: "#1976d2" }}>
    //             {selectedUser.username}
    //           </span>
    //         </Typography>
    //       </Box>
    //       <Box
    //         sx={{
    //           // border: "1px solid #ccc",
    //           flex: 1,
    //           p: 2,
    //           overflow: "auto",
    //           maxHeight: "calc(100vh - 200px)",
    //         }}
    //         flex={1}
    //         p={2}
    //         overflow="auto"
    //       >
    //         {messages.map((msg, idx) => (
    //           <Box
    //             key={idx}
    //             display="flex"
    //             flexDirection="column"
    //             alignItems={
    //               msg.sender === user?.email ? "flex-end" : "flex-start"
    //             }
    //             mb={0.5}
    //           >
    //             <Box
    //               p={1.2}
    //               borderRadius={2}
    //               bgcolor={
    //                 msg.sender === user?.email ? "primary.main" : "grey.200"
    //               }
    //               color={msg.sender === user?.email ? "white" : "black"}
    //               maxWidth="70%"
    //             >
    //               <Typography variant="body1">{msg.text}</Typography>
    //             </Box>

    //             <Typography
    //               variant="caption"
    //               sx={{
    //                 fontSize: "0.65rem",
    //                 opacity: 0.6,
    //                 mt: 0.3,
    //               }}
    //             >
    //               {msg.createdAt
    //                 ? new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
    //                     hour: "2-digit",
    //                     minute: "2-digit",
    //                   })
    //                 : ""}
    //             </Typography>
    //           </Box>
    //         ))}
    //       </Box>
    //       <Box p={2} display="flex" gap={1}>
    //         <TextField
    //           fullWidth
    //           value={text}
    //           onChange={(e) => setText(e.target.value)}
    //           placeholder="Type a message..."
    //           size="small"
    //           onKeyDown={(e) => {
    //             if (e.key === "Enter" && !e.shiftKey) {
    //               e.preventDefault();
    //               handleSend();
    //             }
    //           }}
    //         />
    //         <Button variant="contained" onClick={handleSend}>
    //           Send
    //         </Button>
    //       </Box>
    //     </>
    //   ) : (
    //     <Box
    //       flex={1}
    //       display="flex"
    //       justifyContent="center"
    //       alignItems="center"
    //     >
    //       <Typography>Select a user to chat</Typography>
    //     </Box>
    //   )}
    // </Box>
    // </Box>
  );
}

"use client";
import { useEffect, useState } from "react";
import { db } from "../../../lib/firebase.config";
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore";
import PostCard from "./PostCard";

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
  createdAt: string | number;
}

interface PostListProps {
  currentUserId: string;
}

export default function PostList({ currentUserId }: PostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);

  const getUserByEmail = async (email: string): Promise<User> => {
    const userQ = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(userQ);
    if (!snap.empty) {
      const u = snap.docs[0];
      const data = u.data();
      return {
        id: u.id,
        username: data.username ?? "Unknown",
        avatar: data.avatar ?? "",
      };
    }
    return { id: "", username: "Unknown", avatar: "" };
  };

  const fetchPosts = async () => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const postsData: Post[] = [];
    for (const docSnap of snap.docs) {
      const postData = docSnap.data();

      // lấy author theo email
      const author = await getUserByEmail(postData.authorId);

      // lấy comments
      const commentsSnap = await getDocs(
        collection(db, "posts", docSnap.id, "comments")
      );
      const comments: Comment[] = [];
      for (const c of commentsSnap.docs) {
        const cData = c.data();
        const user = await getUserByEmail(cData.userId);
        comments.push({ id: c.id, text: cData.text, user });
      }

      postsData.push({
        id: docSnap.id,
        title: postData.title,
        thrilled: postData.thrilled,
        imageUrl: postData.imageUrl,
        sent: postData.sent,
        createdAt: postData.createdAt,
        author,
        comments,
      });
    }

    setPosts(postsData);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onRefresh={fetchPosts}
        />
      ))}
    </>
  );
}

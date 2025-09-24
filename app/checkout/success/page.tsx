"use client";

import React, { useEffect, useState } from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase.config";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const amount = Number(searchParams.get("amount") || "0");
  const email = searchParams.get("email");
  const transactionId = searchParams.get("session_id"); // Stripe session_id

  const [status, setStatus] = useState<
    "loading" | "success" | "already_completed" | "error"
  >("loading");

  useEffect(() => {
    const processTransaction = async () => {
      try {
        if (!email || !amount || !transactionId) {
          setStatus("error");
          return;
        }

        const txRef = doc(db, "transactions", transactionId);
        const txSnap = await getDoc(txRef);

        if (!txSnap.exists()) {
          // Tạo transaction lần đầu
          await setDoc(txRef, {
            email,
            amount,
            status: "pending",
            createdAt: Date.now(),
          });
        }

        const txData = (await getDoc(txRef)).data();

        if (txData?.status !== "completed") {
          // Lấy user theo username
          const q = query(collection(db, "users"), where("email", "==", email));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await updateDoc(userDoc.ref, {
              postsRemaining: increment(amount),
            });
          }

          // Cập nhật transaction thành completed
          await updateDoc(txRef, {
            status: "completed",
            completedAt: Date.now(),
          });

          console.log(
            `✅ Transaction ${transactionId} completed, added ${amount} slots for ${email}`
          );
          setStatus("success");
        } else {
          console.log(
            `⚠️ Transaction ${transactionId} already completed, skipping...`
          );
          setStatus("already_completed");
        }
      } catch (err) {
        console.error("❌ Error processing transaction:", err);
        setStatus("error");
      }
    };

    processTransaction();
  }, [email, amount, transactionId]);

  const renderMessage = () => {
    switch (status) {
      case "loading":
        return "⏳ Đang xử lý giao dịch...";
      case "success":
        return amount > 0
          ? `Bạn đã nhận thêm ${amount} lượt đăng bài cho tài khoản ${email}.`
          : "Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được xử lý thành công.";
      case "already_completed":
        return "⚠️ Giao dịch này đã được xử lý trước đó. Không thể cộng thêm lượt.";
      case "error":
        return "❌ Lỗi: Không thể xử lý giao dịch. Vui lòng liên hệ hỗ trợ.";
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        gap={3}
      >
        <Typography variant="h5" fontWeight="bold">
          {status === "success"
            ? "🎉 Thanh toán thành công!"
            : status === "already_completed"
            ? "⚠️ Giao dịch được xử lý trước đó"
            : status === "error"
            ? "❌ Lỗi giao dịch"
            : "⏳ Đang xử lý..."}
        </Typography>

        <Typography variant="body1" align="center">
          {renderMessage()}
        </Typography>

        <Link href="/" passHref>
          <Button variant="contained" color="primary">
            Quay về trang chủ
          </Button>
        </Link>
      </Box>
    </Container>
  );
}

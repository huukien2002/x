"use client";

import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../lib/firebase.config";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Google } from "@mui/icons-material";

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { handleSubmit, control } = useForm<LoginForm>({
    defaultValues: { email: "", password: "" },
  });

  // Login bằng Email/Password
  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    try {
      // Kiểm tra user trong Firestore
      const q = query(
        collection(db, "users"),
        where("email", "==", data.email),
        where("password", "==", data.password)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("Sai email hoặc mật khẩu");
        return;
      }

      // Lấy user (chỉ 1 kết quả)
      const userDoc = snapshot.docs[0];
      const user = { id: userDoc.id, ...userDoc.data() };

      // Lưu vào localStorage
      localStorage.setItem("user", JSON.stringify(user));

      toast.success("Đăng nhập thành công");
      router.push("/");
      /* eslint-disable @typescript-eslint/no-explicit-any */
    } catch (err: any) {
      console.error(err);
      toast.error("Login error: " + err.message);
    }
  };

  // Login bằng Google
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Query user trong Firestore
      const q = query(
        collection(db, "users"),
        where("email", "==", firebaseUser.email)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error("Tài khoản Google này chưa được đăng ký trong hệ thống!");
        return;
      }

      // Lấy data user đầu tiên (thường chỉ có 1)
      const userDoc = snapshot.docs[0];
      const userData = {
        id: userDoc.id,
        ...userDoc.data(),
      };

      // Lưu user Firestore vào localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      toast.success("Đăng nhập Google thành công");
      router.push("/");
    } catch (err: any) {
      console.error(err);
      toast.error("Google login error: " + err.message);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <Box
        width={400}
        border="1px solid #ccc"
        borderRadius={2}
        p={3}
        boxShadow={1}
      >
        <Typography variant="h5" align="center" mb={2}>
          Login
        </Typography>

        {/* Form login email/password */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            {/* Email */}
            <Controller
              name="email"
              control={control}
              rules={{ required: "Email is required" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  variant="outlined"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            {/* Password */}
            <Controller
              name="password"
              control={control}
              rules={{ required: "Password is required" }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Password"
                  type="password"
                  variant="outlined"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                />
              )}
            />

            <Button type="submit" variant="contained" color="primary">
              Login
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 2 }}>OR</Divider>

        {/* Google login */}
        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          onClick={handleGoogleLogin}
          startIcon={<Google />}
        >
          Login with Google
        </Button>
      </Box>
    </Box>
  );
}

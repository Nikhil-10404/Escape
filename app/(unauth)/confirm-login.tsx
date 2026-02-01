import { useEffect, useRef } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { publicClient } from "../src/services/http";
import * as SecureStore from "expo-secure-store";

export default function ConfirmLogin() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const router = useRouter();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    intervalRef.current = setInterval(async () => {
      try {
        const res = await publicClient.get(
          `/login-verification-status/${sessionId}`
        );

        if (res.data.status === "APPROVED") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          const finalize = await publicClient.post("/finalize-login", {
            sessionId,
          });
          console.log("FINALIZE LOGIN RESPONSE:", finalize.data);

          await SecureStore.setItemAsync(
            "accessToken",
            finalize.data.accessToken
          );
          await SecureStore.setItemAsync(
            "refreshToken",
            finalize.data.refreshToken
          );
          const at = await SecureStore.getItemAsync("accessToken");
const rt = await SecureStore.getItemAsync("refreshToken");

console.log("TOKENS STORED:", {
  accessToken: !!at,
  refreshToken: !!rt,
});

          router.replace("/home");
        }

        if (res.data.status === "DENIED") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          router.replace("/login");
        }
      } catch (err) {
        console.log("confirm-login polling error:", err);
      }
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionId]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator />
      <Text style={{ marginTop: 12 }}>
        Waiting for email confirmation 🛡️
      </Text>
    </View>
  );
}

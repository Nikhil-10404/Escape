import { Stack } from "expo-router";
import { useMagicFonts } from "./src/theme/fonts";
import { useEffect, useState } from "react";
import RateLimitAlert from "./src/components/RateLimitAlert";
import { registerRateLimitListener } from "./src/utils/rateLimitBus";

export default function RootLayout() {
  const [fontsLoaded] = useMagicFonts();

  const [rateAlert, setRateAlert] = useState<{
    title: string;
    message: string;
    retryAfter: number;
  } | null>(null);

  useEffect(() => {
    registerRateLimitListener((payload) => {
      setRateAlert({
        title: payload.title,
        message: payload.message,
        retryAfter: payload.retryAfter,
      });
    });
  }, []);

  if (!fontsLoaded) return null;

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(unauth)" />
        <Stack.Screen name="(auth)" />
      </Stack>

      {rateAlert && (
        <RateLimitAlert
          visible={true}
          title={rateAlert.title}
          message={rateAlert.message}
          retryAfter={rateAlert.retryAfter}
          onClose={() => setRateAlert(null)}
        />
      )}
    </>
  );
}

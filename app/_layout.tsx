import { Stack } from "expo-router";
import { useMagicFonts } from "./src/theme/fonts";

export default function RootLayout() {
  const [fontsLoaded] = useMagicFonts();
  if (!fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(unauth)" />
      <Stack.Screen name="(auth)" />
    </Stack>
  );
}

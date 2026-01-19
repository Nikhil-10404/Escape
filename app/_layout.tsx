import { Slot } from "expo-router";
import { useMagicFonts } from "./src/theme/fonts";

export default function RootLayout() {
  const [fontsLoaded] = useMagicFonts();
  if (!fontsLoaded) return null;

  return <Slot />;
}

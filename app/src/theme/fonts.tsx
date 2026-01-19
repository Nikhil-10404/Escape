import { useFonts } from "expo-font";

export function useMagicFonts() {
  return useFonts({
    Harry: require("../assets/harry.ttf"),
  });
}

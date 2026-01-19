import Constants from "expo-constants";

const baseUrl =
  (Constants.expoConfig?.extra?.API_BASE_URL as string) ||
  "http://10.254.19.198:5000"; // fallback (optional)

export const API = `${baseUrl}/api/auth`;

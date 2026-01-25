import Constants from "expo-constants";

// const baseUrl ="http://192.168.62.198:5000"; // fallback (optional)
// export const API = `${baseUrl}/api/auth`;

const DEV = "http://10.187.145.198:5000";
const PROD = "https://your-production-backend.com";

export const baseUrl = __DEV__ ? DEV : PROD;
export const API = `${baseUrl}/api/auth`;

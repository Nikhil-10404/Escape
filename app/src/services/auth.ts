import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API } from "../config/api";
import { firebaseAuth } from "../config/firebase";
import { getDeviceId, getDeviceInfo } from "../utils/device";
import { getPreciseLocationPayload } from "../utils/location";
import { apiClient } from "./http";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";

export async function signup(data: {
  fullName: string;
  email: string;
  password: string;
}) {
  const res = await axios.post(`${API}/signup`, data);
  return res.data;
}

export async function login(email: string, password: string) {
  const deviceId = await getDeviceId();
  const { deviceName, platform, appVersion } = getDeviceInfo();
  const location = await getPreciseLocationPayload();

  const res = await axios.post(`${API}/login`, {
    email,
    password,
    deviceId,
    deviceName,
    platform,
    appVersion,
    location,
  });

  await SecureStore.setItemAsync(ACCESS_KEY, res.data.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, res.data.refreshToken);
  return res.data.user;
}


export async function getToken() {
  return await SecureStore.getItemAsync(ACCESS_KEY);
}


export async function logout() {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}


export const sendForgotOTP = (email: string) =>
  axios.post(`${API}/forgot-spell`, { email });

export const verifyOTP = (email: string, otp: string) =>
  axios.post(`${API}/verify-otp`, { email, otp });

export async function resetSpell(resetToken: string, password: string) {
  const res = await axios.post(`${API}/reset-spell`, {
    resetToken,
    password,
  });
  return res.data;
}

export const resendSignupOTP = (email: string) =>
  axios.post(`${API}/resend-signup-otp`, { email });

export const verifySignupOTP = (email: string, otp: string) =>
  axios.post(`${API}/verify-signup-otp`, { email, otp });

export async function firebaseGoogleLoginAPI() {
  const idToken = await firebaseAuth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Firebase ID token missing");

  const deviceId = await getDeviceId();
  const { deviceName, platform, appVersion } = getDeviceInfo();
  const location = await getPreciseLocationPayload();

  const res = await axios.post(`${API}/firebase-google-login`, {
    idToken,
    deviceId,
    deviceName,
    platform,
    appVersion,
    location,
  });

 await SecureStore.setItemAsync(ACCESS_KEY, res.data.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, res.data.refreshToken);
  return res.data.user;
}

// export async function getSessions() {
//   const token = await getToken();
//   const res = await axios.get(`${API}/sessions`, {
//     headers: { Authorization: token },
//   });
//   return res.data;
// }

export async function getSessions() {
  const res = await apiClient.get(`/sessions`);
  return res.data;
}



// export async function logoutSession(sessionId: string) {
//   const token = await getToken();
//   const res = await axios.post(
//     `${API}/sessions/logout/${sessionId}`,
//     {},
//     { headers: { Authorization: token } }
//   );
//   return res.data;
// }

// export async function logoutAllSessions() {
//   const token = await getToken();
//   const res = await axios.post(
//     `${API}/sessions/logout-all`,
//     {},
//     { headers: { Authorization: token } }
//   );
//   return res.data;
// }

export async function logoutSession(sessionId: string) {
  const res = await apiClient.post(`/sessions/logout/${sessionId}`, {});
  return res.data;
}

export async function logoutAllSessions() {
  const res = await apiClient.post(`/sessions/logout-all`, {});
  return res.data;
}


export async function linkGoogleAPI(firebaseIdToken: string, password: string) {
  const token = await getToken(); // ✅ YOUR APP JWT from SecureStore

  if (!token) throw new Error("App token missing. Please login again.");

  const res = await axios.post(
    `${API}/link-google`,
    { firebaseIdToken, password },
    { headers: { Authorization: token } } // ✅ correct
  );

  return res.data;
}

export async function setPasswordAPI(newPassword: string) {
  const token = await getToken();

  const res = await axios.post(
    `${API}/set-password`,
    { newPassword },
    { headers: { Authorization: token } }
  );

  return res.data;
}

export async function unlinkGoogleAPI(password: string) {
  const token = await getToken();

  const res = await axios.post(
    `${API}/unlink-google`,
    { password },
    { headers: { Authorization: token } }
  );

  return res.data;
}

export async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refreshToken) throw new Error("No refresh token");

  const res = await axios.post(
    `${API}/refresh`,
    {},
    { headers: { Authorization: `Bearer ${refreshToken}` } }
  );

  await SecureStore.setItemAsync(ACCESS_KEY, res.data.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, res.data.refreshToken);

  return res.data.accessToken;
}

// export async function getProfile() {
//   const token = await getToken();
//   const res = await axios.get(`${API}/me`, {
//     headers: { Authorization: token },
//   });
//   return res.data;
// }

export async function getProfile() {
  const res = await apiClient.get(`/me`);
  return res.data;
}


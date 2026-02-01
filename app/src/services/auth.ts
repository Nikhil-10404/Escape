import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API } from "../config/api";
import { firebaseAuth } from "../config/firebase";
import { getDeviceId, getDeviceInfo } from "../utils/device";
import { getPreciseLocationPayload } from "../utils/location";
import { apiClient, publicClient } from "./http";

const ACCESS_KEY = "accessToken";
const REFRESH_KEY = "refreshToken";
const BACKUP_LEFT_KEY = "backupCodesLeft";

// ✅ Signup (public)
export async function signup(data: {
  fullName: string;
  email: string;
  password: string;
}) {
  const res = await publicClient.post(`/signup`, data);
  return res.data;
}

// ✅ Normal Login (public)
export async function login(email: string, password: string) {
  const deviceId = await getDeviceId();
  const { deviceName, platform, appVersion } = getDeviceInfo();
  const location = await getPreciseLocationPayload();

  const res = await  publicClient.post(`/login`, {
    email,
    password,
    deviceId,
    deviceName,
    platform,
    appVersion,
    location,
  });

  // ✅ if 2FA required -> return temp token
  if (res.data.requires2FA) {
    return res.data;
  }

  // ✅ store tokens
  await SecureStore.setItemAsync(ACCESS_KEY, res.data.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, res.data.refreshToken);

  return res.data.user;
}

export async function firebaseGoogleLoginAPI() {
  const idToken = await firebaseAuth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Firebase ID token missing");

  const deviceId = await getDeviceId();
  const { deviceName, platform, appVersion } = getDeviceInfo();
  const location = await getPreciseLocationPayload();

  const res = await publicClient.post(`/firebase-google-login`, {
    idToken,
    deviceId,
    deviceName,
    platform,
    appVersion,
    location,
  });

  if (res.data.requires2FA) {
    return res.data;
  }

  await SecureStore.setItemAsync(ACCESS_KEY, res.data.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, res.data.refreshToken);

  return res.data.user;
}

// ✅ token helpers
export async function getToken() {
  return await SecureStore.getItemAsync(ACCESS_KEY);
}

export async function logout() {
  try {
    await apiClient.post(`/logout`,{});
  } catch (err) {
    console.log("logout api error:", err);
  } finally {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await SecureStore.deleteItemAsync(BACKUP_LEFT_KEY);
  }
}

// ✅ Forgot Password
export const sendForgotOTP = (email: string) =>
  publicClient.post(`/forgot-spell`, { email });

export const verifyOTP = (email: string, otp: string) =>
  publicClient.post(`/verify-otp`, { email, otp });

export async function resetSpell(resetToken: string, password: string) {
  const res = await publicClient.post(`/reset-spell`, { resetToken, password });
  return res.data;
}

export const resendSignupOTP = (email: string) =>
  publicClient.post(`/resend-signup-otp`, { email });

export const verifySignupOTP = (email: string, otp: string) =>
  publicClient.post(`/verify-signup-otp`, { email, otp });

// ✅ Sessions (protected)
export async function getSessions() {
  const res = await apiClient.get(`/sessions`);
  return res.data;
}

export async function logoutSession(sessionId: string) {
  const res = await apiClient.post(`/sessions/logout/${sessionId}`, {});
  return res.data;
}

export async function logoutAllSessions() {
  const res = await apiClient.post(`/sessions/logout-all`, {});
  return res.data;
}

// ✅ Link/Unlink Google (protected)
export async function linkGoogleAPI(firebaseIdToken: string, password: string) {
  const token = await getToken();
  if (!token) throw new Error("App token missing. Please login again.");

  const res = await apiClient.post(
    `/link-google`,
    { firebaseIdToken, password },
    { headers: { Authorization: token } }
  );

  return res.data;
}

export async function unlinkGoogleAPI(password: string) {
  const token = await getToken();

  const res = await apiClient.post(
    `/unlink-google`,
    { password },
    { headers: { Authorization: token } }
  );

  return res.data;
}

export async function setPasswordAPI(newPassword: string) {
  const token = await getToken();

  const res = await apiClient.post(
    `${API}/set-password`,
    { newPassword },
    { headers: { Authorization: token } }
  );

  return res.data;
}

// ✅ Refresh token (public)
export async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refreshToken) throw new Error("No refresh token");

  const res = await publicClient.post(
    `/refresh`,
    {},
    { headers: { Authorization: `Bearer ${refreshToken}` } }
  );

  await SecureStore.setItemAsync(ACCESS_KEY, res.data.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, res.data.refreshToken);

  return res.data.accessToken;
}

// ======================
// ✅ 2FA (protected + public flows)
// ======================

// ✅ Setup (protected)
export async function totpSetupAPI() {
  const res = await apiClient.post(`/2fa/totp/setup`, {});
  return res.data;
}

export async function totpConfirmAPI(code: string) {
  const res = await apiClient.post(`/2fa/totp/confirm`, { code });
  return res.data;
}

// ✅ Verify login (public route but needs x-device-id manually)
export async function totpVerifyLoginAPI(tempLoginToken: string, code: string) {
  const deviceId = await getDeviceId();

  const res = await publicClient.post(
    `/2fa/totp/verify-login`,
    { tempLoginToken, code },
    { headers: { "x-device-id": deviceId } }
  );

  await SecureStore.setItemAsync(ACCESS_KEY, res.data.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, res.data.refreshToken);

  if (typeof res.data.backupCodesLeft === "number") {
    await saveBackupCodesLeft(res.data.backupCodesLeft);
  }

  return res.data;
}

// ✅ Backup login (public)
export async function backupLoginAPI(tempLoginToken: string, backupCode: string) {
  const deviceId = await getDeviceId();

  const res = await publicClient.post(
    `/backup-login`,
    { tempLoginToken, backupCode },
    { headers: { "x-device-id": deviceId } }
  );

  await SecureStore.setItemAsync(ACCESS_KEY, res.data.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, res.data.refreshToken);

  if (typeof res.data.backupCodesLeft === "number") {
    await saveBackupCodesLeft(res.data.backupCodesLeft);
  }

  return res.data;
}

// ✅ Disable 2FA (protected)
export async function totpDisableAPI(password: string, code: string) {
  const res = await apiClient.post(`/2fa/totp/disable`, { password, code });
  return res.data;
}

export async function regenerateBackupCodesAPI(code: string) {
  const res = await apiClient.post(`/totp/regenerate-backup-codes`, { code });
  return res.data;
}

// ✅ Backup left helpers
export async function saveBackupCodesLeft(count: number) {
  await SecureStore.setItemAsync(BACKUP_LEFT_KEY, String(count));
}

export async function getBackupCodesLeft() {
  const v = await SecureStore.getItemAsync(BACKUP_LEFT_KEY);
  return v ? Number(v) : null;
}

export async function getAuditLogs(limit = 50, cursor?: string | null) {
  const params: any = { limit };
  if (cursor) params.cursor = cursor;

  const res = await apiClient.get(`/audit-logs`, { params });
  return res.data as { logs: any[]; nextCursor: string | null };
}

// ✅ Profile (protected)
export async function getProfile() {
  const res = await apiClient.get(`/me`);
  return res.data;
}

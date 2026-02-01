import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API } from "../config/api";
import { getDeviceId } from "../utils/device";
import { emitRateLimit } from "../utils/rateLimitBus";
import { handleRateLimit } from "../utils/handleRateLimit";

const ACCESS_KEY = "accessToken";

// ✅ Public client (NO interceptors)
export const publicClient = axios.create({
  baseURL: API,
});

publicClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (handleRateLimit(error)) {
      return Promise.reject({ __rateLimited: true });
    }
    return Promise.reject(error);
  }
);

// ✅ Protected client (WITH interceptors)
export const apiClient = axios.create({
  baseURL: API,
});

// ✅ attach access token + deviceId to every protected request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ACCESS_KEY);

  if (token) {
    config.headers.Authorization = token; // ✅ NO "Bearer"
  }

  const deviceId = await getDeviceId();
  if (deviceId) {
    config.headers["x-device-id"] = deviceId;
  }

  return config;
});

// ✅ handle expired access token (refresh + retry)
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    console.log("AXIOS ERROR:", {
  url: error.config?.url,
  status: error.response?.status,
  data: error.response?.data,
});

      if (handleRateLimit(error)) {
      return Promise.reject({ __rateLimited: true });
    }

    const originalRequest = error.config;

      if (
  error.response?.status === 403 &&
  error.response?.data?.requiresEmailConfirmation
) {
  // 🚫 DO NOT logout
  return Promise.reject(error);
}

    // ✅ prevent infinite loops
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // ✅ IMPORTANT: refresh must use publicClient
      
 const refreshToken = await SecureStore.getItemAsync("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const refreshRes = await publicClient.post(
          `/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        );

        const newAccessToken = refreshRes.data.accessToken;
        const newRefreshToken = refreshRes.data.refreshToken;

        await SecureStore.setItemAsync("accessToken", newAccessToken);
        await SecureStore.setItemAsync("refreshToken", newRefreshToken);

        // ✅ keep deviceId on retry
        const deviceId = await getDeviceId();
        if (deviceId) {
          originalRequest.headers["x-device-id"] = deviceId;
        }

        // ✅ retry with new token
        originalRequest.headers.Authorization = newAccessToken;

        return apiClient(originalRequest);
      } catch (err) {
        // refresh failed → clear & reject
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

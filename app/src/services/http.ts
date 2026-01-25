import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API } from "../config/api";
import { refreshAccessToken } from "./auth";
import { getDeviceId } from "../utils/device"; // ✅ NEW

const ACCESS_KEY = "accessToken";

export const apiClient = axios.create({
  baseURL: API,
});

// ✅ attach access token + deviceId to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ACCESS_KEY);

  if (token) {
    config.headers.Authorization = token; // ✅ NO "Bearer" for access token
  }

  // ✅ DEVICE BINDING HEADER (NEW)
  const deviceId = await getDeviceId();
  if (deviceId) {
    config.headers["x-device-id"] = deviceId;
  }

  return config;
});

// ✅ if access token expired -> refresh once -> retry
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        // ✅ IMPORTANT: also keep deviceId on retry
        const deviceId = await getDeviceId();
        if (deviceId) {
          originalRequest.headers["x-device-id"] = deviceId;
        }

        originalRequest.headers.Authorization = newAccessToken;
        return apiClient(originalRequest);
      } catch (err) {
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

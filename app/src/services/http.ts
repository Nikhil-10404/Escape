import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API } from "../config/api";
import { refreshAccessToken } from "./auth";

const ACCESS_KEY = "accessToken";

export const apiClient = axios.create({
  baseURL: API,
});

// ✅ attach access token to every request
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ACCESS_KEY);

  if (token) {
    config.headers.Authorization = token; // ✅ NO "Bearer" for access token
  }

  return config;
});

// ✅ if access token expired -> refresh once -> retry
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    // ✅ stop infinite loop
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        originalRequest.headers.Authorization = newAccessToken;
        return apiClient(originalRequest);
      } catch (err) {
        // refresh failed -> user must login again
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

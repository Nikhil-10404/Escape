import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API } from "../config/api";

export async function signup(data: {
  fullName: string;
  email: string;
  password: string;
}) {
  const res = await axios.post(`${API}/signup`, data);
  return res.data;
}

export async function login(email: string, password: string) {
  const res = await axios.post(`${API}/login`, { email, password });
  await SecureStore.setItemAsync("token", res.data.token);
  return res.data.user;
}

export async function getToken() {
  return await SecureStore.getItemAsync("token");
}

export async function logout() {
  await SecureStore.deleteItemAsync("token");
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

export async function getProfile() {
  const token = await getToken();
  const res = await axios.get(`${API}/me`, {
    headers: { Authorization: token },
  });
  return res.data;
}

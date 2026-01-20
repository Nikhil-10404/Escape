import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import * as Application from "expo-application";
import { Platform } from "react-native";

export async function getDeviceId() {
  const existing = await SecureStore.getItemAsync("deviceId");
  if (existing) return existing;

  const newId = `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await SecureStore.setItemAsync("deviceId", newId);
  return newId;
}

export function getDeviceInfo() {
  return {
    deviceName: Device.modelName || "Unknown Device",
    platform: Platform.OS,
    appVersion: Application.nativeApplicationVersion || "1.0.0",
  };
}

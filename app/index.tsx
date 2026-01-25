import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { refreshAccessToken } from "./src/services/auth";
import { View, Text } from "react-native";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [locationAllowed, setLocationAllowed] = useState(false);

  useEffect(() => {
    async function boot() {
      try {
        // ✅ 1) Check location permission
        const { status } = await Location.getForegroundPermissionsAsync();
        const allowed = status === "granted";
        setLocationAllowed(allowed);

        if (!allowed) {
          setLoading(false);
          return;
        }

        // ✅ 2) Check refresh token
        const refreshToken = await SecureStore.getItemAsync("refreshToken");

        if (!refreshToken) {
          setLoggedIn(false);
          setLoading(false);
          return;
        }

        // ✅ 3) Refresh access token automatically
        await refreshAccessToken();

        // ✅ 4) If refresh success → user is logged in
        setLoggedIn(true);
      } catch (err) {
        // ✅ refresh failed or error → logout fully
        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("refreshToken");
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, []);

  if (loading) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Summoning your magic...</Text>
    </View>
  );
};

  if (!locationAllowed) {
    return <Redirect href="/location-gate" />;
  }

  return loggedIn ? <Redirect href="/home" /> : <Redirect href="/login" />;
}

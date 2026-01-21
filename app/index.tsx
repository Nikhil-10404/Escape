import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { getToken } from "./src/services/auth";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [locationAllowed, setLocationAllowed] = useState(false);

  useEffect(() => {
    async function boot() {
      try {
        // ✅ 1) Check token
        const token = await getToken();
        setLoggedIn(!!token);

        // ✅ 2) Check location permission
        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationAllowed(status === "granted");
      } catch (err) {
        setLoggedIn(false);
        setLocationAllowed(false);
      } finally {
        setLoading(false);
      }
    }

    boot();
  }, []);

  if (loading) return null;

  // ✅ If location not allowed → go to gate screen
  if (!locationAllowed) {
    return <Redirect href="./location-gate" />;
  }

  // ✅ If location allowed → normal flow
  if (loggedIn) {
    return <Redirect href="/home" />;
  } else {
    return <Redirect href="/login" />;
  }
}

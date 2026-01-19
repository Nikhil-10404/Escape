import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { getToken } from "./src/services/auth";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    getToken().then((token) => {
      setLoggedIn(!!token);
      setLoading(false);
    });
  }, []);

  if (loading) return null;

  if (loggedIn) {
    return <Redirect href="/home" />;
  } else {
    return <Redirect href="/login" />;
  }
}

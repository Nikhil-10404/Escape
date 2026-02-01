import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { useRouter } from "expo-router";
import { getProfile, logout } from "../services/auth";

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
         console.log("CALLING /me");
      const data = await getProfile();
      console.log("PROFILE DATA:", data);
        setUser(data);
      } catch (err){
        console.log("PROFILE LOAD FAILED:", err);
        // token invalid / expired
        await logout();
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  // ⏳ Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Summoning your magic...</Text>
      </View>
    );
  }

  // 🧹 Safety check (should never happen, but protects app)
  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user.fullName}</Text>
      <Text style={styles.subtitle}>
        You have entered the Wizarding World
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={async () => {
          await logout();
          router.replace("/login");
        }}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity
  style={[styles.button, { marginTop: 14 }]}
  onPress={() => router.push("/(auth)/manage-devices")}
>
  <Text style={styles.buttonText}>Manage Devices 🪄</Text>
</TouchableOpacity>

<TouchableOpacity
  style={[styles.button, { marginTop: 14 }]}
  onPress={() => router.push("./settings")}
>
  <Text style={styles.buttonText}>Settings ⚙️</Text>
</TouchableOpacity>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontFamily: "Harry",
    fontSize: 32,
    color: colors.gold,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    color: colors.softGold,
    marginBottom: 40,
    textAlign: "center",
  },
  loading: {
    color: colors.gold,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.gold,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 16,
  },
  buttonText: {
    fontFamily: "Harry",
    fontSize: 20,
    color: "#2A1600",
  },
});

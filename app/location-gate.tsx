import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import * as Location from "expo-location";
import { colors } from "./src/theme/colors";
import MagicalAlert from "./src/components/MagicalAlert";
import { useRouter } from "expo-router";
import { getToken } from "./src/services/auth";

export default function LocationGate() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  async function goNext() {
    const token = await getToken();
    if (token) router.replace("/home");
    else router.replace("/login");
  }

  async function checkPermission() {
    setChecking(true);

    const { status } = await Location.getForegroundPermissionsAsync();

    if (status === "granted") {
      await goNext();
      return;
    }

    setChecking(false);
  }

  async function requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status === "granted") {
      await goNext();
      return;
    }

    setAlert({
      visible: true,
      title: "📍 Location Required",
      message:
        "To protect your account and show device login location, you must allow location access.",
    });
  }

  useEffect(() => {
    checkPermission();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Location Spell Required</Text>
      <Text style={styles.subtitle}>
        To enter the castle, we must verify where your device is logged in.
      </Text>

      <TouchableOpacity style={styles.button} onPress={requestPermission}>
        <Text style={styles.buttonText}>
          {checking ? "Checking..." : "Allow Location ⚡"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          {
            marginTop: 12,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: colors.gold,
          },
        ]}
        onPress={() => Linking.openSettings()}
      >
        <Text style={[styles.buttonText, { color: colors.gold }]}>
          Open Settings 🪄
        </Text>
      </TouchableOpacity>

      <MagicalAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttonText="Understood ⚡"
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontFamily: "Harry",
    fontSize: 30,
    color: colors.gold,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    color: colors.softGold,
    textAlign: "center",
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    fontFamily: "Harry",
    fontSize: 18,
    color: "#2A1600",
    textAlign: "center",
  },
});

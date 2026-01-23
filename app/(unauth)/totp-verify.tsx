import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import MagicalAlert from "../src/components/MagicalAlert";
import { colors } from "../src/theme/colors";
import {
  totpVerifyLoginAPI,
  backupLoginAPI,
  getBackupCodesLeft,
  saveBackupCodesLeft,
} from "../src/services/auth";

export default function TotpVerifyScreen() {
  const router = useRouter();
  const { tempLoginToken } = useLocalSearchParams<{ tempLoginToken: string }>();

  const [backupLeft, setBackupLeft] = useState<number | null>(null);

  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [input, setInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    getBackupCodesLeft().then(setBackupLeft);
  }, []);

  // ✅ backup normalize: remove dash/spaces etc -> "9B5CE324"
  const cleanBackup = useMemo(() => {
    return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }, [input]);

  const isValid = useMemo(() => {
    if (mode === "totp") return input.trim().length === 6;
    return cleanBackup.length === 8; // because XXXX-XXXX becomes 8 chars after cleaning
  }, [mode, input, cleanBackup]);

  async function verify() {
    try {
      if (!tempLoginToken) {
        setAlert({
          visible: true,
          title: "Dark Magic Error",
          message: "Login session missing. Please login again.",
        });
        return;
      }

      if (!isValid) {
        setAlert({
          visible: true,
          title: "Invalid Code",
          message:
            mode === "totp"
              ? "Authenticator code must be exactly 6 digits."
              : "Backup code must look like 9B5C-E324.",
        });
        return;
      }

      setLoading(true);

      if (mode === "totp") {
        const res = await totpVerifyLoginAPI(tempLoginToken, input.trim());

        // ✅ update backup left
        if (typeof res?.backupCodesLeft === "number") {
          await saveBackupCodesLeft(res.backupCodesLeft);
          setBackupLeft(res.backupCodesLeft);
        }

        setAlert({
          visible: true,
          title: "✨ 2FA Verified",
          message: "Your wand is confirmed. Welcome to the castle!",
        });
      } else {
        // ✅ send cleaned backup code (no dash)
        const res = await backupLoginAPI(tempLoginToken, cleanBackup);

        if (typeof res?.backupCodesLeft === "number") {
          await saveBackupCodesLeft(res.backupCodesLeft);
          setBackupLeft(res.backupCodesLeft);
        }

        setAlert({
          visible: true,
          title: "📜 Backup Code Accepted",
          message: "The scroll protected you. Welcome back wizard!",
        });
      }
    } catch (err: any) {
      setAlert({
        visible: true,
        title: "Dark Magic Blocked",
        message: err?.response?.data?.error || err?.message || "2FA failed",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Castle Gate Check</Text>

      <Text style={styles.subtitle}>
        {mode === "totp"
          ? "Enter the 6-digit code from your Authenticator spellbook."
          : "Lost your Authenticator? Use a backup code from your scroll."}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={mode === "totp" ? "123456" : "9B5C-E324"}
        placeholderTextColor="#999"
        keyboardType={mode === "totp" ? "numeric" : "default"}
        value={input}
        onChangeText={(t) => {
          if (mode === "totp") {
            // ✅ digits only
            setInput(t.replace(/[^0-9]/g, "").slice(0, 6));
            return;
          }

          // ✅ backup codes: XXXX-XXXX formatting
          const cleaned = t.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);

          let formatted = cleaned;
          if (cleaned.length > 4) {
            formatted = cleaned.slice(0, 4) + "-" + cleaned.slice(4);
          }

          setInput(formatted);
        }}
        maxLength={mode === "totp" ? 6 : 9}
        autoCapitalize="characters"
        editable={!loading}
      />

      {backupLeft !== null && (
        <Text style={styles.backupLeftText}>
          📜 Backup codes left: {backupLeft}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, (!isValid || loading) && { opacity: 0.55 }]}
        onPress={verify}
        disabled={!isValid || loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Verifying..." : "Verify & Enter ⚡"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchBtn}
        onPress={() => {
          setMode(mode === "totp" ? "backup" : "totp");
          setInput("");
        }}
        disabled={loading}
      >
        <Text style={styles.switchText}>
          {mode === "totp"
            ? "Use Backup Code Instead 📜"
            : "Use Authenticator Instead 🔐"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/login")} disabled={loading}>
        <Text style={styles.back}>← Back to Login</Text>
      </TouchableOpacity>

      <MagicalAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttonText="Continue ⚡"
        onClose={() => {
          setAlert({ ...alert, visible: false });
          if (alert.title.includes("Verified") || alert.title.includes("Accepted")) {
            router.replace("/home");
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#070A14",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontFamily: "Harry",
    fontSize: 32,
    color: colors.gold,
    textAlign: "center",
  },
  subtitle: {
    color: colors.softGold,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    textAlign: "center",
    fontSize: 18,
    letterSpacing: 6,
  },

  backupLeftText: {
    marginTop: 10,
    color: colors.softGold,
    textAlign: "center",
    fontSize: 12,
  },

  button: {
    backgroundColor: colors.gold,
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    fontFamily: "Harry",
    fontSize: 18,
    color: "#2A1600",
    textAlign: "center",
  },

  switchBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  switchText: {
    fontFamily: "Harry",
    fontSize: 16,
    color: colors.gold,
    textAlign: "center",
  },

  back: { marginTop: 18, textAlign: "center", color: colors.softGold },
});

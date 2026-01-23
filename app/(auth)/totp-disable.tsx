import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useRouter } from "expo-router";
import MagicalAlert from "../src/components/MagicalAlert";
import { colors } from "../src/theme/colors";
import { totpDisableAPI, logout, getProfile } from "../src/services/auth";

export default function TotpDisableScreen() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  function showAlert(title: string, message: string) {
    setAlert({ visible: true, title, message });
  }

  async function disable2FA() {
    try {
      const finalPassword = password.trim();
      const finalCode = code.trim();

      if (!finalCode || finalCode.length !== 6 || !/^\d{6}$/.test(finalCode)) {
        showAlert("Invalid Code ❌", "Authenticator code must be exactly 6 digits.");
        return;
      }

      // ✅ Check profile: if user has password, require password to disable
      setLoading(true);
      const profile = await getProfile();

      if (profile?.hasPassword && !finalPassword) {
        showAlert("Secret Spell Required 🔐", "Enter your password to disable 2FA.");
        return;
      }

      await totpDisableAPI(finalPassword, finalCode);

      showAlert(
        "✅ 2FA Disabled",
        "Authenticator protection removed. You can enable it again anytime."
      );
    } catch (err: any) {
      showAlert(
        "Dark Magic Blocked",
        err?.response?.data?.error || err?.message || "Failed to disable 2FA"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>🧹 Disable 2FA</Text>

        <Text style={styles.subtitle}>
          Disabling 2FA removes your Authenticator protection.
          {"\n"}To confirm, enter your Secret Spell and the 6-digit code.
        </Text>

        <Text style={styles.label}>Secret Spell (Password)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your secret spell"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <Text style={styles.label}>Authenticator Code (6-digit)</Text>
        <TextInput
          style={styles.input}
          placeholder="123456"
          placeholderTextColor="#999"
          keyboardType="numeric"
          value={code}
          maxLength={6}
          onChangeText={(t) => setCode(t.replace(/[^0-9]/g, "").slice(0, 6))}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.6 }]}
          disabled={loading}
          onPress={disable2FA}
        >
          {loading ? (
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <ActivityIndicator color="#2A1600" />
              <Text style={[styles.buttonText, { marginLeft: 10 }]}>
                Disabling...
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Disable 2FA 🧹</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Text style={styles.back}>← Return to Settings</Text>
        </TouchableOpacity>

        <MagicalAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          buttonText="Understood ⚡"
          onClose={async () => {
            const disabled = alert.title.includes("2FA Disabled");
            setAlert({ ...alert, visible: false });

            if (disabled) {
              // ✅ Best practice: logout after disabling 2FA
              await logout();
              router.replace("/login");
            }
          }}
        />
      </View>
    </TouchableWithoutFeedback>
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
    fontSize: 34,
    color: colors.gold,
    textAlign: "center",
  },
  subtitle: {
    color: colors.softGold,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
    lineHeight: 18,
    fontSize: 13,
  },
  label: {
    color: colors.softGold,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.gold,
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    fontFamily: "Harry",
    fontSize: 18,
    color: "#2A1600",
    textAlign: "center",
  },
  back: {
    marginTop: 18,
    textAlign: "center",
    color: colors.softGold,
  },
});

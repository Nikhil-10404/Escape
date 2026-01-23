import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import MagicalAlert from "../src/components/MagicalAlert";
import { colors } from "../src/theme/colors";
import { totpSetupAPI, totpConfirmAPI } from "../src/services/auth";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { downloadBackupCodesPdf } from "../src/utils/backupPdf";
import { getProfile } from "../src/services/auth";


export default function TotpSetupScreen() {
  const router = useRouter();

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "setup">("idle");

  const [savedBackupCodes, setSavedBackupCodes] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
const [pdfLoading, setPdfLoading] = useState(false);


  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  const [profile, setProfile] = useState<any>(null);

React.useEffect(() => {
  getProfile().then(setProfile).catch(() => {});
}, []);


  function showAlert(title: string, message: string) {
    setAlert({ visible: true, title, message });
  }

  async function startSetup() {
    try {
      setConfirmLoading(true);

      const data = await totpSetupAPI();

      setQrDataUrl(data.qrDataUrl);
      setManualKey(data.manualKey);
      setBackupCodes(data.backupCodes || []);
      setSavedBackupCodes(false);

      setStep("setup");
    } catch (err: any) {
      console.log("BEGIN 2FA ERROR:", err?.response?.data || err?.message || err);

      showAlert(
        "Dark Magic Interference 🧿",
        err?.response?.data?.error || "Failed to start 2FA setup."
      );
    } finally {
       setConfirmLoading(false);
    }
  }

  async function copySecretKey() {
    if (!manualKey) return;

    await Clipboard.setStringAsync(manualKey);
    showAlert("🪄 Copied!", "Secret Key copied. Paste it into your Authenticator app.");
  }

  async function copyBackupCodes() {
    if (!backupCodes?.length) return;

    const text = backupCodes.join("\n");
    await Clipboard.setStringAsync(text);

    showAlert(
      "📜 Backup Codes Copied!",
      "Saved in clipboard. Store them safely (Notes / Password manager)."
    );
  }

 async function downloadBackupCodesTxt() {
  try {
    if (!backupCodes?.length) {
      showAlert("No Backup Codes", "No backup codes available yet.");
      return;
    }

    const fileContent =
      `ESCAPE — Backup Codes (2FA)\n` +
      `--------------------------------\n` +
      `Each code works only once.\n\n` +
      backupCodes.map((c) => `- ${c}`).join("\n") +
      `\n\n⚠️ Keep them safe. Do NOT share.\n`;

    const FS: any = FileSystem;

const fileUri = (FS.cacheDirectory || FS.documentDirectory) + "backup_codes.txt";

    await FileSystem.writeAsStringAsync(fileUri, fileContent, {
      encoding: "utf8" as any,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      showAlert(
        "Cannot Share File",
        "Sharing is not available on this device. You can still copy the codes."
      );
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: "text/plain",
      dialogTitle: "Save your Backup Codes",
      UTI: "public.plain-text",
    });
  } catch (err: any) {
    console.log("downloadBackupCodesTxt error:", err?.message || err);
    showAlert("Dark Magic Interference", "Failed to export backup codes file.");
  }
}

  async function confirm() {
    try {
      const finalCode = code.trim();

      if (!savedBackupCodes) {
        showAlert(
          "Backup Codes Not Saved 📜",
          "Please confirm you saved your backup codes before enabling 2FA."
        );
        return;
      }

      if (finalCode.length !== 6 || !/^\d{6}$/.test(finalCode)) {
        showAlert("Invalid Code ❌", "Authenticator code must be exactly 6 digits.");
        return;
      }

       setConfirmLoading(true);

      await totpConfirmAPI(finalCode);

      showAlert(
        "🛡️ 2FA Enabled!",
        "Your wizard account is now protected by Authenticator magic."
      );
    } catch (err: any) {
      showAlert(
        "Wrong Spell ⚡",
        err?.response?.data?.error || "Invalid authenticator code. Try the latest one."
      );
    } finally {
       setConfirmLoading(false);
    }
  }

  const setupReady = !!qrDataUrl && !!manualKey && backupCodes.length > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🛡️ Enable Authenticator 2FA</Text>

      <Text style={styles.subtitle}>
        This adds a second security spell.
        Even if someone steals your password, they still can’t enter without your
        Authenticator code.
      </Text>

      {step === "idle" && (
        <TouchableOpacity style={styles.button} onPress={startSetup} disabled={confirmLoading}>
          <Text style={styles.buttonText}>
            {confirmLoading ? "Summoning Setup..." : "Begin Setup ⚡"}
          </Text>
        </TouchableOpacity>
      )}

      {step === "setup" && (
        <View style={styles.card}>
          {!setupReady ? (
            <View style={{ alignItems: "center", paddingVertical: 16 }}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={styles.smallText}>Preparing your QR spell...</Text>
            </View>
          ) : (
            <>
              {/* ✅ EASY STEPS */}
              <Text style={styles.cardTitle}>✨ Setup in Google Authenticator</Text>

              <View style={styles.stepsBox}>
                <Text style={styles.stepText}>
                  <Text style={styles.stepBold}>Step 1:</Text> Open{" "}
                  <Text style={styles.stepBold}>Google Authenticator</Text> → Tap{" "}
                  <Text style={styles.stepBold}>“+”</Text>
                </Text>

                <Text style={styles.stepText}>
                  <Text style={styles.stepBold}>Step 2:</Text> Choose{" "}
                  <Text style={styles.stepBold}>“Scan a QR code”</Text> → Scan the QR below
                </Text>

                <Text style={styles.stepText}>
                  <Text style={styles.stepBold}>Step 3:</Text> Authenticator will show a{" "}
                  <Text style={styles.stepBold}>6-digit code</Text> → Enter it below
                </Text>
              </View>

              {/* ✅ QR */}
              <Text style={[styles.cardTitle, { marginTop: 14 }]}>📷 Scan QR Code</Text>
              <Image source={{ uri: qrDataUrl }} style={styles.qr} />

              {/* ✅ MANUAL STEPS */}
              <Text style={[styles.cardTitle, { marginTop: 14 }]}>⌨️ Manual Setup (if QR doesn’t work)</Text>

              <View style={styles.stepsBox}>
                <Text style={styles.stepText}>
                  <Text style={styles.stepBold}>In Authenticator App:</Text>
                </Text>

                <Text style={styles.stepText}>
                  • Tap <Text style={styles.stepBold}>+</Text> → choose{" "}
                  <Text style={styles.stepBold}>Enter a setup key</Text>
                </Text>

                <Text style={styles.stepText}>
                  • <Text style={styles.stepBold}>Account / Name:</Text> Type something like{" "}
                  <Text style={styles.stepBold}>Escape ({`your email`})</Text>
                </Text>

                <Text style={styles.stepText}>
                  • <Text style={styles.stepBold}>Key:</Text> Paste the secret key below
                </Text>

                <Text style={styles.stepText}>
                  • <Text style={styles.stepBold}>Type:</Text> Select{" "}
                  <Text style={styles.stepBold}>Time-based</Text>
                </Text>
              </View>

              <View style={styles.keyBox}>
                <Text style={styles.smallText}>Your Secret Key:</Text>
                <Text style={styles.keyText}>{manualKey}</Text>

                <TouchableOpacity style={styles.copyBtn} onPress={copySecretKey}>
                  <Text style={styles.copyBtnText}>Copy Secret Key 🪄</Text>
                </TouchableOpacity>
              </View>

              {/* ✅ BACKUP CODES */}
              <Text style={[styles.cardTitle, { marginTop: 16 }]}>🧾 Backup Codes</Text>
              <Text style={styles.smallText}>
                If you lose your phone, you can login using these.
                {"\n"}✅ Each code works only once.
              </Text>

              <View style={styles.backupBox}>
                {backupCodes.map((c) => (
                  <Text key={c} style={styles.backupCode}>
                    {c}
                  </Text>
                ))}
              </View>

              <View style={styles.rowButtons}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={copyBackupCodes}>
                  <Text style={styles.secondaryBtnText}>Copy 📜</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={downloadBackupCodesTxt}
                >
                  <Text style={styles.secondaryBtnText}>Download .txt ⬇️</Text>
                </TouchableOpacity> */}

                <TouchableOpacity
  style={[
    styles.button,
    {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.gold,
    },
  ]}
  onPress={async () => {
    try {
      setPdfLoading(true);

      await downloadBackupCodesPdf(
        backupCodes,
        profile?.fullName || "Wizard"
      );

      setAlert({
        visible: true,
        title: "📜 Backup Scroll Saved",
        message:
          "Keep it safe. These codes can recover your account if you lose your wand (Authenticator).",
      });
    } catch (err: any) {
      setAlert({
        visible: true,
        title: "Dark Magic Interference",
        message: err?.message || "Failed to save backup scroll",
      });
    } finally {
      setPdfLoading(false);
    }
  }}
  disabled={pdfLoading}
>
  <Text style={[styles.buttonText, { color: colors.gold }]}>
    {pdfLoading ? "Preparing Scroll..." : "Download Backup Scroll (PDF) 📜"}
  </Text>
</TouchableOpacity>

              </View>

              {/* ✅ Checkbox */}
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setSavedBackupCodes((prev) => !prev)}
              >
                <View style={[styles.checkbox, savedBackupCodes && styles.checkboxChecked]}>
                  {savedBackupCodes ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>

                <Text style={styles.checkboxText}>
                  I saved my backup codes safely ✅
                </Text>
              </TouchableOpacity>

              {/* ✅ Confirm */}
              <Text style={[styles.cardTitle, { marginTop: 18 }]}>✅ Confirm OTP</Text>
              <Text style={styles.smallText}>
                Enter the 6-digit code from your Authenticator app.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="123456"
                placeholderTextColor="#999"
                keyboardType="numeric"
                maxLength={6}
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ""))}
              />

              <TouchableOpacity
                style={[
                  styles.button,
                  (!savedBackupCodes || confirmLoading) && { opacity: 0.6 },
                ]}
                onPress={confirm}
                disabled={!savedBackupCodes || confirmLoading}
              >
                <Text style={styles.buttonText}>
                  {confirmLoading ? "Verifying..." : "Enable 2FA ⚡"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Return to Settings</Text>
      </TouchableOpacity>

      <MagicalAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttonText="Understood ⚡"
        onClose={() => {
          const enabled = alert.title.includes("2FA Enabled");
          setAlert({ ...alert, visible: false });

          if (enabled) {
            router.replace("/settings");
          }
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
    marginBottom: 18,
    lineHeight: 18,
    fontSize: 13,
  },

  card: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  cardTitle: {
    fontFamily: "Harry",
    fontSize: 20,
    color: colors.gold,
    marginBottom: 8,
    textAlign: "center",
  },

  stepsBox: {
    borderWidth: 1,
    borderColor: "rgba(255,215,100,0.35)",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(255, 215, 100, 0.06)",
    marginBottom: 10,
  },

  stepText: {
    color: colors.softGold,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },

  stepBold: {
    color: colors.gold,
    fontFamily: "Harry",
  },

  qr: {
    width: 220,
    height: 220,
    alignSelf: "center",
    marginVertical: 10,
    borderRadius: 10,
  },

  smallText: {
    color: colors.softGold,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },

  keyBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  keyText: {
    color: colors.gold,
    textAlign: "center",
    fontFamily: "Harry",
    fontSize: 16,
    marginBottom: 10,
    letterSpacing: 1,
  },

  copyBtn: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
    paddingVertical: 10,
  },

  copyBtnText: {
    color: colors.gold,
    textAlign: "center",
    fontFamily: "Harry",
    fontSize: 16,
  },

  backupBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,215,100,0.35)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.18)",
  },

  backupCode: {
    color: colors.softGold,
    textAlign: "center",
    marginTop: 6,
    fontSize: 14,
    letterSpacing: 1.5,
  },

  rowButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 12,
    borderRadius: 14,
  },

  secondaryBtnText: {
    color: colors.gold,
    textAlign: "center",
    fontFamily: "Harry",
    fontSize: 16,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    justifyContent: "center",
    gap: 10,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxChecked: {
    backgroundColor: "rgba(255,215,100,0.25)",
  },

  checkMark: {
    color: colors.gold,
    fontFamily: "Harry",
    fontSize: 16,
    marginTop: -1,
  },

  checkboxText: {
    color: colors.softGold,
    fontSize: 12,
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
    marginTop: 10,
    marginBottom: 12,
  },

  button: {
    backgroundColor: colors.gold,
    marginTop: 14,
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

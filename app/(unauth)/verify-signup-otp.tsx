import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { colors } from "../../app/src/theme/colors";
import { useRouter, useLocalSearchParams } from "expo-router";
import MagicalAlert from "../../app/src/components/MagicalAlert";
import { resendSignupOTP, verifySignupOTP } from "../../app/src/services/auth";

export default function VerifySignupOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<TextInput[]>([]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const [alert, setAlert] = useState({ visible: false, title: "", message: "" });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (canResend) return;

    if (timer === 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, canResend]);

  function handleChange(text: string, index: number) {
    if (!/^\d?$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleBackspace(index: number) {
    if (otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function resendOTP() {
    if (!email) return;

    try {
      await resendSignupOTP(email);

      setAlert({
        visible: true,
        title: "✨ New Magic Sent",
        message: "A fresh verification scroll has arrived.",
      });

      setOtp(["", "", "", "", "", ""]);
      setTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setAlert({
        visible: true,
        title: "Dark Magic Interference",
        message: err.response?.data?.error || "Unable to resend.",
      });
    }
  }

  async function verifyOTP() {
    const code = otp.join("");

    if (code.length !== 6) {
      setAlert({
        visible: true,
        title: "Incomplete Spell",
        message: "Please enter the full 6-digit code.",
      });
      setSuccess(false);
      return;
    }

    try {
      await verifySignupOTP(email, code);

router.replace({
  pathname: "/login",
  params: { verified: "true" },
});


      setAlert({
        visible: true,
        title: "✨ Owl Verified",
        message: "Your owl post address is now verified. You may enter the world!",
      });
      setSuccess(true);
    } catch (err: any) {
      setAlert({
        visible: true,
        title: "Wrong Code",
        message: err.response?.data?.error || "Invalid code.",
      });
      setSuccess(false);
    }
  }

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.inner}>
          <Text style={styles.title}>Verify Owl Post</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to your owl post
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputs.current[index] = ref;
                }}
                style={styles.otpBox}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace") {
                    handleBackspace(index);
                  }
                }}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={verifyOTP}>
            <Text style={styles.buttonText}>Verify Spell ✨</Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {!canResend ? (
              <Text style={styles.resendText}>
                Didn’t receive OTP? Send in{" "}
                <Text style={styles.timer}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={resendOTP}>
                <Text style={[styles.resendText, styles.resendActive]}>
                  Didn’t receive OTP? Send again
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      <MagicalAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttonText={success ? "Continue ⚡" : "Try Again"}
        onClose={() => {
          setAlert({ ...alert, visible: false });
          if (success) {
            router.replace({
              pathname: "/login",
              params: { verified: "true" },
            });
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 30,
    justifyContent: "center",
  },
  inner: {
    justifyContent: "center",
  },
  title: {
    fontFamily: "Harry",
    fontSize: 30,
    color: colors.gold,
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    color: colors.softGold,
    textAlign: "center",
    marginBottom: 30,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  otpBox: {
    width: 45,
    height: 55,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: colors.inputBg,
    textAlign: "center",
    fontSize: 20,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.gold,
    padding: 16,
    borderRadius: 14,
  },
  buttonText: {
    fontFamily: "Harry",
    fontSize: 20,
    color: "#2A1600",
    textAlign: "center",
  },
  resendContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  resendText: {
    color: "#C7B27C",
    fontSize: 14,
    fontFamily: "Harry",
  },
  timer: {
    color: "#FFD27D",
    fontWeight: "bold",
  },
  resendActive: {
    color: "#FFD27D",
    textDecorationLine: "underline",
  },
});

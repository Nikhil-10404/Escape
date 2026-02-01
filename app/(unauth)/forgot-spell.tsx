import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Keyboard,
  StyleSheet,
} from "react-native";

import { useRouter } from "expo-router";
import { colors } from "../src/theme/colors";
import { useMagicFonts } from "../src/theme/fonts";
import MagicalAlert from "../src/components/MagicalAlert";
import { sendForgotOTP } from "../src/services/auth";

export default function ForgotSpell() {
  const [email, setEmail] = useState("");
  const [alert, setAlert] = useState({ visible: false, title: "", message: "" });
  const router = useRouter();
  const [fontsLoaded] = useMagicFonts();
  const [keyboardHeight] = React.useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);

  if (!fontsLoaded) return null;

    React.useEffect(() => {
      const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
        Animated.timing(keyboardHeight, {
          toValue: e.endCoordinates.height,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });
    
      const hideSub = Keyboard.addListener("keyboardDidHide", () => {
        Animated.timing(keyboardHeight, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });
    
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }, []);

 async function sendOTP() {
  if (!email) return;
  setLoading(true); // 🔒 lock button instantly

  try {
    await sendForgotOTP(email); // backend validation

    // ✅ success → move immediately
    router.push({
      pathname: "/verify-otp",
      params: { email },
    });

  } catch (e: any) {
     if (e?.__rateLimited) {
    return;
  }
    const status = e?.response?.status;
    const msg = e?.response?.data?.error;

    setAlert({
      visible: true,
      title: status === 429 ? "🛡️ Owl Post Blocked" : "No Wizard Found",
      message:
        status === 429
          ? "Too many OTP requests. Please wait 1 minute and try again."
          : msg || "Dark magic interfered",
    });
  } finally {
    setLoading(false); // 🔓 unlock if failed
  }
}

  return (
    <View style={styles.root}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Animated.View style={[styles.overlay, { paddingBottom: keyboardHeight }]}>
                  
      <Text style={styles.icon}>✉️</Text>

      <Text style={styles.title}>Forgot Your Spell?</Text>
      <Text style={styles.subtitle}>
        Don’t worry, we’ll help you remember
      </Text>

      <Text style={styles.label}>Owl Post Address</Text>
      <TextInput
        style={styles.input}
        placeholder="your.name@hogwarts.edu"
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
      />

<TouchableOpacity
  style={[styles.button, loading && { opacity: 0.6 }]}
  onPress={sendOTP}
  disabled={loading}
>
  <Text style={styles.buttonText}>
    {loading ? "Sending Magic Scroll..." : "Send Magic Scroll ⚡"}
  </Text>
</TouchableOpacity>


      <MagicalAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
      </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
   root: {
  flex: 1,
  backgroundColor: "#000",
},
    overlay: {
  flex: 1,
  width: "100%",
  backgroundColor: "rgba(8,10,25,0.85)",
  justifyContent: "center",
  padding: 30,
},
   container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 30,
    justifyContent: "center",
  },
  icon: {
    fontSize: 40,
    textAlign: "center",
    marginBottom: 16,
    color: colors.gold,
  },
  title: {
    fontFamily: "Harry",
    fontSize: 30,
    color: colors.gold,
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    textAlign: "center",
    marginBottom: 30,
  },
  label: {
    color: colors.muted,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    color: colors.text,
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.goldDark,
    padding: 16,
    borderRadius: 16,
  },
  buttonText: {
    fontFamily: "Harry",
    color: "#2A1600",
    fontSize: 20,
    textAlign: "center",
  },
});

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../src/theme/colors";
import { useMagicFonts } from "../src/theme/fonts";
import MagicalAlert from "../src/components/MagicalAlert";
import { resetSpell } from "../src/services/auth";

export default function ResetSpell() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [alert, setAlert] = useState({ visible: false, title: "", message: "" });
  const router = useRouter();
  const [fontsLoaded] = useMagicFonts();
  const strength = getStrength(password);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [keyboardHeight] = React.useState(new Animated.Value(0));
  const { resetToken, resetTokenExpiry } =
  useLocalSearchParams<{ resetToken: string; resetTokenExpiry: string }>();
  const [expired, setExpired] = useState(false);
  const expiryTime = resetTokenExpiry ? new Date(resetTokenExpiry).getTime() : 0;
  

const [timeLeft, setTimeLeft] = useState(() => {
  if (!expiryTime) return 0;
  return Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
});

console.log("RESET PARAMS:", resetToken);
console.log("EXPIRY STRING:", resetTokenExpiry);
console.log("EXPIRY NUMBER:", expiryTime);
console.log("TIMELEFT INIT:", timeLeft);


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

React.useEffect(() => {
  if (expired) return;

  if (timeLeft <= 0) {
    setExpired(true);
    setAlert({
      visible: true,
      title: "⏳ Magic Faded",
      message: "Your reset spell has expired. Please request a new magic scroll.",
    });
    return;
  }

  const interval = setInterval(() => {
    setTimeLeft((t) => t - 1);
  }, 1000);

  return () => clearInterval(interval);
}, [timeLeft, expired]);

  async function reset() {
    if (password !== confirm) {
      setAlert({
        visible: true,
        title: "Spell Mismatch",
        message: "The spells do not match",
      });
      return;
    }

  try {
  await resetSpell(resetToken, password);
  router.replace({
  pathname: "/login",
  params: {
  spellReset: "true",
  },
});
} catch (err: any) {
   if (err?.__rateLimited) {
    return;
  }
  const errorMsg = err.response?.data?.error;

  if (errorMsg === "Invalid reset session") {
    setAlert({
      visible: true,
      title: "⏳ Spell Expired",
      message:
        "This magic session has expired. Please request a new magic scroll.",
    });

    setTimeout(() => {
      router.replace("/forgot-spell");
    }, 1200);
  } else {
    setAlert({
      visible: true,
      title: "Dark Magic Interference",
      message: "Failed to reset spell. Please try again.",
    });
  }
}
}

  function getStrength(password: string) {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

   if (score <= 1)
    return { label: "Weak Spell", color: "#C0392B", flex: 1 };

  if (score === 2 || score === 3)
    return { label: "Decent Spell", color: "#F1C40F", flex: 2 };

  return { label: "Master Spell", color: "#2ECC71", flex: 3 };
}


  return (
    <View style={styles.root}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Animated.View style={[styles.overlay, { paddingBottom: keyboardHeight }]}>
      <Text style={styles.icon}>🔒</Text>

      <Text style={styles.title}>Reset Your Spell</Text>
      <Text style={styles.subtitle}>Create a new powerful spell</Text>
      <Text style={styles.timer}>
  ⏳ Time remaining: {Math.floor(timeLeft / 60)}:
  {(timeLeft % 60).toString().padStart(2, "0")}
</Text>


     <Text style={styles.label}>New Secret Spell</Text>

<View style={styles.passwordRow}>
  <TextInput
    style={styles.input}
    secureTextEntry={!showNewPassword}
    onChangeText={setPassword}
    placeholderTextColor="#999"
    placeholder="Enter your secret spell"
  />
  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
    <Text style={styles.eye}>{showNewPassword ? "🙈" : "👁"}</Text>
  </TouchableOpacity>
</View>

{password.length > 0 && (
  <>
    <View style={styles.strengthBar}>
      <View
        style={{
          flex: strength.flex,
          backgroundColor: strength.color,
        }}
      />
      <View style={{ flex: 3 - strength.flex }} />
    </View>

    <Text style={[styles.strengthText, { color: strength.color }]}>
      {strength.label}
    </Text>
  </>
)}



<Text style={styles.label}>Confirm Secret Spell</Text>

<View style={styles.passwordRow}>
  <TextInput
    style={styles.input}
    secureTextEntry={true}   // 🔒 ALWAYS hidden
    onChangeText={setConfirm}
    placeholderTextColor="#999"
    placeholder="Confirm your secret spell"
  />
</View>



      {password === confirm && password.length > 0 && (
        <Text style={styles.success}>✔ Spells match perfectly!</Text>
      )}

<TouchableOpacity
  style={[styles.button, expired && { opacity: 0.5 }]}
  disabled={expired}
  onPress={reset}
>
  <Text style={styles.buttonText}>
    {expired ? "Spell Expired" : "Reset Spell ⚡"}
  </Text>
</TouchableOpacity>


      <MagicalAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
       onClose={() => {
  setAlert({ ...alert, visible: false });

  if (expired) {
    router.back(); // Reset -> Verify
    router.back(); // Verify -> Forgot
  }
}}
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
timer: {
  color: "#FFD27D",
  textAlign: "center",
  marginBottom: 16,
  fontFamily: "Harry",
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
    color: colors.gold,
    textAlign: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: "Harry",
    fontSize: 32,
    color: colors.gold,
    textAlign: "center",
  },
  subtitle: {
    color: colors.muted,
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    color: colors.muted,
    marginTop: 14,
  },
  passwordRow: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 14,
  paddingHorizontal: 12,
  marginTop: 6,
},

input: {
  flex: 1,
  paddingVertical: 14,
  color: colors.text,
},

strengthBar: {
  flexDirection: "row",
  height: 6,
  backgroundColor: "#333",
  borderRadius: 4,
  overflow: "hidden",
  marginTop: 10,
},

strengthText: {
  marginTop: 8,
  fontSize: 12,
  fontFamily: "Harry",
},

eye: {
  fontSize: 22,
  paddingLeft: 12,
  color: colors.gold,
},

  success: {
    color: colors.success,
    marginTop: 10,
  },
  button: {
    backgroundColor: colors.goldDark,
    padding: 16,
    borderRadius: 16,
    marginTop: 30,
  },
  buttonText: {
    fontFamily: "Harry",
    color: "#2A1600",
    fontSize: 20,
    textAlign: "center",
  },
  input1: {
  padding: 14,
  color: colors.text,
},
});

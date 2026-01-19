import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from "react-native";

import { useRouter } from "expo-router";

import { colors } from "../theme/colors";
import MagicalAlert from "../components/MagicalAlert";
import { signup as signupAPI } from "../services/auth";

export default function SignupScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({
  visible: false,
  title: "",
  message: "",
});

  const [fullName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardHeight] = React.useState(new Animated.Value(0));
  const router = useRouter();
  const strength=getStrength(password);

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


function showAlert(title: string, message: string) {
  setAlert({ visible: true, title, message });
}


function validate() {
  if (fullName.trim().length < 3) {
    showAlert("Your wizard name lacks magic", "It must be at least 3 characters long");
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAlert("This owl post address is invalid", "Please enter a valid address");
    return false;
  }

  if (password.length < 8) {
    showAlert("Weak Spell", "Your secret spell must be at least 8 characters");
    return false;
  }

  if (!/\d/.test(password)) {
    showAlert("Weak Spell", "Your secret spell must contain at least one number");
    return false;
  }

  return true;
}

  async function signup() {
 
  if (!validate()) return;
  setLoading(true);
  try {
    await signupAPI({ fullName, email, password });

router.replace({
  pathname: "/verify-signup-otp",
  params: { email },
});


    setAlert({
      visible: true,
      title: "✨ Welcome, Wizard!",
      message: "Your journey at Hogwarts begins now.",
    });

    setSuccess(true);
  } catch (err: any) {
  showAlert(
    "Spell Failed",
    err.response?.data?.error || "Dark magic interfered with the spell"
  );
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
    <ImageBackground source={require("../assets/bg.jpeg")} style={styles.bg} resizeMode="cover">
   <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <Animated.View style={[styles.overlay, { paddingBottom: keyboardHeight }]}>


        <Image
          source={require("../assets/wand.jpeg")}
          style={styles.wand}
        />

        <Text style={styles.title}>Join the Wizarding World</Text>
        <Text style={styles.subtitle}>Begin your magical journey</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          onChangeText={setName}
          placeholderTextColor="#999"
          placeholder="Enter your name"
        />

        <Text style={styles.label}>Owl Post Address</Text>
        <TextInput
          style={styles.input}
          onChangeText={setEmail}
          placeholderTextColor="#999"
          placeholder="yourname@hogwarts.com"
        />

        <Text style={styles.label}>Secret Spell</Text>
        <View style={styles.passwordRow}>
  <TextInput
    style={[styles.input1, { flex: 1 }]}
    secureTextEntry={!showPassword}
    onChangeText={setPassword}
    placeholderTextColor="#999"
    placeholder="Enter your secret spell"
  />
  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
    <Text style={styles.eye}>
      {showPassword ? "🙈" : "👁"}
    </Text>
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

<TouchableOpacity
  style={[styles.button, loading && { opacity: 0.6 }]}
  onPress={signup}
  disabled={loading}
>
  <Text style={styles.buttonText}>
    {loading ? "Sending Magic Scroll..." : "Cast Your Spell ⚡"}
  </Text>
</TouchableOpacity>

  <View style={styles.signInRow}>
  <Text style={styles.signInText}>Already a wizard? </Text>
  <Text style={styles.signInLink} onPress={() => router.push("/login")}>
  Sign In
</Text>

</View>

    </Animated.View>
    </TouchableWithoutFeedback>
    <MagicalAlert
  visible={alert.visible}
  title={alert.title}
  message={alert.message}
  buttonText={success ? "Enter the Academy ⚡" : "Understood"}
  onClose={() => {
    setAlert({ ...alert, visible: false });
    if (success) router.replace("/home");
  }}
/>

</ImageBackground>
</View>
  );
}

const styles = StyleSheet.create({
 root: {
  flex: 1,
  backgroundColor: "#000",
},

bg: {
  flex: 1,
  width: "100%",
  height: "100%",
},

overlay: {
  flex: 1,
  width: "100%",
  backgroundColor: "rgba(8,10,25,0.85)",
  justifyContent: "center",
  padding: 30,
},

  wand: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 20,
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
    marginBottom: 30,
  },
  label: {
    color: colors.softGold,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    color: colors.text,
  },
  input1: {
  padding: 14,
  color: colors.text,
},

  button: {
    backgroundColor: colors.gold,
    marginTop: 32,
    padding: 16,
    borderRadius: 14,
  },
  buttonText: {
    fontFamily: "Harry",
    fontSize: 20,
    color: "#2A1600",
    textAlign: "center",
  },
  signInRow: {
  flexDirection: "row",
  justifyContent: "center",
  marginTop: 18,
},
signInText: {
  color: "#D6C28A",
},
signInLink: {
  color: "#FFD27D",
  fontWeight: "bold",
  textDecorationLine: "underline",
},
passwordRow: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.gold,
  borderRadius: 12,
  marginTop: 6,
  backgroundColor: colors.inputBg,
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
  paddingHorizontal: 12,
  color: colors.gold,
},

});


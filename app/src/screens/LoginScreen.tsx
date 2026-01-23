import React, { useState,useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
} from "react-native";
import { colors } from "../theme/colors";
import { useRouter } from "expo-router";
import { login as loginAPI } from "../services/auth";
import MagicalAlert from "../components/MagicalAlert";
import { useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { firebaseAuth } from "../config/firebase";
import { firebaseGoogleLoginAPI } from "../services/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams<{ spellReset?: string }>();
  const [alertAction, setAlertAction] = useState<
  "login-success" | "reset-success" |"otp-verified"| "error" | null
  >(null);
  const { verified } = useLocalSearchParams<{ verified: string }>();
  const [keyboardHeight] = useState(new Animated.Value(0));
  const [alert, setAlert] = useState({
  visible: false,
  title: "",
  message: "",
  });
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  GoogleSignin.configure({
  webClientId:
    "776660008357-gnau7nq0nij2v5mffoc2kqjgrbfkj880.apps.googleusercontent.com",
});

async function googleLogin() {
  if (googleLoading) return;

  try {
    setGoogleLoading(true);

    await GoogleSignin.hasPlayServices();

    // ✅ Force chooser every time
    await GoogleSignin.signOut();

    const userInfo = await GoogleSignin.signIn();

    const idToken = (userInfo as any)?.idToken || (userInfo as any)?.data?.idToken;

    // ✅ User dismissed
    if (!idToken) return;

    // ✅ Convert Google token -> Firebase token
    const credential = GoogleAuthProvider.credential(idToken);
    await signInWithCredential(firebaseAuth, credential);

    // ✅ Backend login (may return requires2FA)
    const data = await firebaseGoogleLoginAPI();

    // ✅ If TOTP is enabled -> go verify screen
    if (data?.requires2FA) {
      router.replace({
        pathname: "./totp-verify",
        params: { tempLoginToken: data.tempLoginToken },
      });
      return;
    }

    // ✅ normal success
    setAlert({
      visible: true,
      title: "✨ Welcome Wizard",
      message: "Google magic accepted. Enter the castle!",
    });
    setAlertAction("login-success");
  } catch (err: any) {
    // ✅ cancel/dismiss -> do nothing
    if (
      err?.code === "SIGN_IN_CANCELLED" ||
      err?.message?.toLowerCase()?.includes("cancel") ||
      err?.message?.toLowerCase()?.includes("dismiss")
    ) {
      return;
    }

    console.log("Google Login error:", err);

    setAlert({
      visible: true,
      title: "Dark Magic Blocked",
      message: err?.response?.data?.error || err?.message || "Google login failed",
    });
    setAlertAction("error");
  } finally {
    setGoogleLoading(false);
  }
}


  useEffect(() => {
  if (params.spellReset === "true") {
    setAlert({
      visible: true,
      title: "✨ Spell Updated",
      message: "Your secret spell has been updated successfully.",
    });
     setAlertAction("reset-success");
    }
    }, []);

    useEffect(() => {
  if (verified === "true") {
    setAlert({
      visible: true,
      title: "✨ Verified!",
      message: "Your owl post address is securly verified. You may now sign in.",
    });
    setSuccess(false);
    setAlertAction("otp-verified");
  }
}, []);

  useEffect(() => {
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

async function login() {
  try {
    const data = await loginAPI(email, password);

    // ✅ If TOTP required -> go verify screen
    if (data?.requires2FA) {
      router.replace({
        pathname: "./totp-verify",
        params: { tempLoginToken: data.tempLoginToken },
      });
      return;
    }

    // ✅ Normal login success
    setAlert({
      visible: true,
      title: "✨ Welcome Back",
      message: "The castle doors open for you once again.",
    });
    setSuccess(true);
    setAlertAction("login-success");
  } catch (err: any) {
    const errorMsg = err.response?.data?.error;

    if (errorMsg === "Wizard not found") {
      setAlert({
        visible: true,
        title: "Wizard Unknown",
        message: "No wizard is registered with this owl post address.",
      });
    } else if (errorMsg === "Wrong secret spell") {
      setAlert({
        visible: true,
        title: "Wrong Spell",
        message: "The secret spell does not match our records.",
      });
    } else if (errorMsg === "Use Google login") {
      setAlert({
        visible: true,
        title: "🪄 Google Wizard Detected",
        message: "This owl post is linked to Google. Please use Google Login.",
      });
    } else {
      setAlert({
        visible: true,
        title: "Dark Magic Interference",
        message: errorMsg || "Something went wrong. Please try again.",
      });
    }

    setSuccess(false);
    setAlertAction("error");
  }
}


  return (
    <ImageBackground source={require("../assets/bg.jpeg")} style={styles.bg} resizeMode="cover">
       <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View style={[styles.overlay, { paddingBottom: keyboardHeight }]}>

        <Image
          source={require("../assets/wand.jpeg")}
          style={styles.wand}
        />

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Return to your magical journey</Text>

        <Text style={styles.label}>Owl Post Address</Text>
        <TextInput
          style={styles.input}
          placeholder="yourname@hogwarts.edu"
          placeholderTextColor="#999"
          onChangeText={setEmail}
        />

        <View style={styles.row}>
          <Text style={styles.label}>Secret Spell</Text>
          <Text style={styles.forgot}  onPress={() => router.push("/(unauth)/forgot-spell")}>Forgot Spell?</Text>
        </View>

        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1, borderWidth: 0 }]}
            secureTextEntry={!show}
            placeholder="Enter your secret spell"
            placeholderTextColor="#999"
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShow(!show)}>
            <Text style={styles.eye}>{show ? "🙈" : "👁"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
  style={[styles.button]}
  onPress={login}
>
  <Text style={styles.buttonText}>
     Enter the World ⚡
  </Text>
</TouchableOpacity>


        <Text style={styles.or}>or</Text>

        <TouchableOpacity
  style={[styles.googleBtn, googleLoading && { opacity: 0.6 }]}
  onPress={googleLogin}
  disabled={googleLoading}
>
  <Text style={styles.googleText}>
    {googleLoading ? "Signing in with Google..." : "Continue with Google 🪄"}
  </Text>
</TouchableOpacity>


        <Text style={styles.footer}>
          New to magic? <Text style={styles.link} onPress={() => router.push("/signup")}>
          Begin Your Journey
        </Text>

        </Text>

      </Animated.View>
          </TouchableWithoutFeedback>
          <MagicalAlert
  visible={alert.visible}
  title={alert.title}
  message={alert.message}
  buttonText={
    alertAction === "login-success"
      ? "Enter the World ⚡"
      : alertAction === "reset-success"
      ? "Continue ⚡"
      : alertAction === "otp-verified"
      ? "Continue ⚡"
      : "Try Again"
  }
  onClose={() => {
    setAlert({ ...alert, visible: false });

    if (alertAction === "login-success") {
      router.replace("/home");
    }

    // reset state after handling
    setAlertAction(null);
  }}
/>


    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(8,10,25,0.9)",
    padding: 30,
    justifyContent: "center",
  },
  
  wand: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 20,
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
    marginBottom: 30,
  },
  label: {
    color: colors.softGold,
    marginTop: 14,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    marginTop: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  forgot: {
    color: colors.gold,
    fontSize: 12,
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
  eye: {
    fontSize: 22,
    paddingHorizontal: 12,
    color: colors.gold,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.gold,
    marginRight: 10,
  },
  checked: {
    backgroundColor: colors.gold,
  },
  remember: {
    color: colors.softGold,
  },
  button: {
    backgroundColor: colors.gold,
    marginTop: 30,
    padding: 16,
    borderRadius: 14,
  },
  buttonText: {
    fontFamily: "Harry",
    fontSize: 20,
    color: "#2A1600",
    textAlign: "center",
  },
  or: {
  textAlign: "center",
  color: colors.softGold,
  marginTop: 18,
  marginBottom: 12,
},
  footer: {
  textAlign: "center",
  color: colors.softGold,
  marginTop: 22,     // ✅ gives clean gap
},
  link: {
    color: colors.gold,
    fontWeight: "bold",
  },
 googleBtn: {
  borderWidth: 1,
  borderColor: colors.gold,
  backgroundColor: "rgba(255,255,255,0.05)",
  paddingVertical: 14,
  paddingHorizontal: 14,
  borderRadius: 14,
},

googleText: {
  color: colors.gold,
  fontFamily: "Harry",
  fontSize: 18,
  textAlign: "center",
},

});

import React, { useState,useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator
} from "react-native";
import { colors } from "../src/theme/colors";
import MagicalAlert from "../src/components/MagicalAlert";
import { useRouter } from "expo-router";
import { linkGoogleAPI, setPasswordAPI,getProfile, logout } from "../src/services/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { firebaseAuth } from "../src/config/firebase";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { unlinkGoogleAPI } from "../src/services/auth";


export default function SettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [keyboardHeight] = React.useState(new Animated.Value(0));
  const [loadingPass, setLoadingPass] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const strength=getStrength(newPassword);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  // ✅ Configure Google Signin (works, but better to do once globally later)
  GoogleSignin.configure({
    webClientId:
      "776660008357-gnau7nq0nij2v5mffoc2kqjgrbfkj880.apps.googleusercontent.com",
  });

  async function loadProfile() {
    try {
      setLoadingPage(true);
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      await logout();
      router.replace("/login");
    } finally {
      setLoadingPage(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  // ✅ UI Logic
  const authProviders: string[] = profile?.authProviders || [];
  const hasPassword: boolean = !!profile?.hasPassword;

  const hasGoogle = authProviders.includes("google");
  const hasLocal = authProviders.includes("local") || hasPassword;

  const showLinkGoogle = !hasGoogle;       // ✅ only show if not already linked
  const showSetPassword = !hasPassword; 

  const canUnlinkGoogle = hasGoogle && hasPassword;

  async function linkGoogle() {
    if (linkLoading) return;

    try {
      setLinkLoading(true);

      await GoogleSignin.hasPlayServices();

      // ✅ force chooser every time
      await GoogleSignin.signOut();

      // ✅ open chooser
      const userInfo = await GoogleSignin.signIn();

      // ✅ Google OAuth token (NOT Firebase)
      const googleIdToken =
        (userInfo as any)?.idToken || (userInfo as any)?.data?.idToken;

      // ✅ user dismissed chooser (smooth exit)
      if (!googleIdToken) return;

      // ✅ convert Google token -> Firebase user
      const credential = GoogleAuthProvider.credential(googleIdToken);
      await signInWithCredential(firebaseAuth, credential);

      // ✅ NOW get Firebase ID Token (this is what backend wants)
      const firebaseIdToken = await firebaseAuth.currentUser?.getIdToken();

      if (!firebaseIdToken) {
        throw new Error("Firebase ID token missing");
      }

      // ✅ send firebaseIdToken to backend
      await linkGoogleAPI(firebaseIdToken, confirmPassword);

      setConfirmPassword("");

      setAlert({
        visible: true,
        title: "✨ Google Linked!",
        message: "Your wand is now bound to Google magic too.",
      });

      loadProfile();
    } catch (err: any) {
      // ✅ cancel/dismiss => ignore (no alert)
      if (
        err?.code === "SIGN_IN_CANCELLED" ||
        err?.message?.toLowerCase()?.includes("cancel") ||
        err?.message?.toLowerCase()?.includes("dismiss")
      ) {
        return;
      }

      console.log("Link Google error:", err);

      setAlert({
        visible: true,
        title: "Dark Magic Blocked",
        message:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to link Google",
      });
    } finally {
      setLinkLoading(false);
    }
  }

  async function unlinkGoogle() {
  if (unlinkLoading) return;

  try {
    setUnlinkLoading(true);

    await unlinkGoogleAPI(confirmPassword);

    setConfirmPassword("");

    setAlert({
      visible: true,
      title: "🔥 Google Unlinked",
      message: "Your wand is no longer bound to Google magic.",
    });

    loadProfile();
  } catch (err: any) {
    setAlert({
      visible: true,
      title: "Dark Magic Blocked",
      message:
        err?.response?.data?.error ||
        err?.message ||
        "Failed to unlink Google",
    });
  } finally {
    setUnlinkLoading(false);
  }
}


  function getStrength(password1: string) {
  let score = 0;

  if (password1.length >= 8) score++;
  if (/[A-Z]/.test(password1)) score++;
  if (/[0-9]/.test(password1)) score++;
  if (/[^A-Za-z0-9]/.test(password1)) score++;

   if (score <= 1)
    return { label: "Weak Spell", color: "#C0392B", flex: 1 };

  if (score === 2 || score === 3)
    return { label: "Decent Spell", color: "#F1C40F", flex: 2 };

  return { label: "Master Spell", color: "#2ECC71", flex: 3 };
}

  async function setPassword() {
    if (loadingPass) return;

    try {
      setLoadingPass(true);

      if (!newPassword || newPassword.length < 8 || !/\d/.test(newPassword)) {
        setAlert({
          visible: true,
          title: "Weak Spell 🧪",
          message: "Password must be at least 8 characters and contain a number.",
        });
        return;
      }

      await setPasswordAPI(newPassword);

      setNewPassword("");

      setAlert({
        visible: true,
        title: "✨ Spell Created!",
        message: "Password login has been enabled for your wizard account.",
      });

      loadProfile();
    } catch (err: any) {
      setAlert({
        visible: true,
        title: "Dark Magic Interference",
        message:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to set password",
      });
    } finally {
      setLoadingPass(false);
    }
  }

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

  if (loadingPage) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Preparing your spellbook...</Text>
      </View>
    );
  }


  return (
    <View style={styles.root}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View style={[styles.overlay, { paddingBottom: keyboardHeight }]}>
        <Text style={styles.title}>⚙️ Settings</Text>
        <Text style={styles.subtitle}>Control your wizard account powers</Text>

        {/* ✅ If user has both */}
        {hasGoogle && hasPassword && (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>✅ Fully Protected</Text>
            <Text style={styles.successText}>
              Your account supports both Google and Secret Spell login.
            </Text>
          </View>
        )}

        {/* ✅ LINK GOOGLE ONLY IF NOT ALREADY LINKED */}
        {(showLinkGoogle || (hasGoogle && hasPassword)) && (
          <>
            <Text style={styles.label}>Confirm Secret Spell</Text>
              <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input1, { flex: 1 }]}
              placeholder="Enter your secret spell"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
             <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eye}>
                  {showPassword ? "🙈" : "👁"}
                </Text>
              </TouchableOpacity>
            </View>

            
            {showLinkGoogle && (
            <TouchableOpacity
              style={[
                styles.button,
                (linkLoading) && { opacity: 0.55 },
              ]}
              disabled={ linkLoading}
              onPress={linkGoogle}
            >
              <Text style={styles.buttonText}>
                {linkLoading ? "Linking Google..." : "Link Google Account 🪄"}
              </Text>
            </TouchableOpacity>
            )}
            {hasGoogle && hasPassword && (
      <TouchableOpacity
        style={[
          styles.btn2,
          ( unlinkLoading) && { opacity: 0.55 },
        ]}
        disabled={unlinkLoading}
        onPress={unlinkGoogle}
      >
        <Text style={styles.btn2Text}>
          {unlinkLoading ? "Unlinking..." : "Unlink Google 🔥"}
        </Text>
      </TouchableOpacity>
    )}
          </>
        )}


        {/* ✅ SET PASSWORD ONLY IF PASSWORD NOT SET */}
        {showSetPassword && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enable Password Login 🔐</Text>
            <Text style={styles.cardSub}>
              Create a secret spell so you can login without Google
            </Text>
             <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input1, { flex: 1 }]}
              placeholder="Enter new secret spell"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eye}>
                  {showPassword ? "🙈" : "👁"}
                </Text>
              </TouchableOpacity>
            </View>

            {newPassword.length > 0 && (
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
              style={[styles.btn2, loadingPass && { opacity: 0.6 }]}
              onPress={setPassword}
              disabled={loadingPass}
            >
              <Text style={styles.btn2Text}>
                {loadingPass ? "Casting..." : "Set Password ⚡"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ fallback (should not happen much) */}
        {!showLinkGoogle && !showSetPassword && !(hasGoogle && hasPassword) && (
          <Text style={styles.note}>
            Your account settings are already complete ✅
          </Text>
        )}

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Return to the Castle</Text>
        </TouchableOpacity>

        <MagicalAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          buttonText="Understood ⚡"
          onClose={() => setAlert({ ...alert, visible: false })}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#070A14",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 14,
    color: colors.gold,
    fontFamily: "Harry",
    fontSize: 18,
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#070A14",
    padding: 24,
    justifyContent: "center",
  },
   root: {
  flex: 1,
  backgroundColor: "#000",
},
  passwordRow: {
  flexDirection: "row",
  alignItems: "center",
  borderWidth: 1,
  borderColor: colors.gold,
  borderRadius: 12,
  marginTop: 2,
  backgroundColor: colors.inputBg,
  marginBottom:12,
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
  overlay: {
  flex: 1,
  width: "100%",
  backgroundColor: "rgba(8,10,25,0.85)",
  justifyContent: "center",
  padding: 30,
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
    marginTop: 6,
    marginBottom: 22,
  },
  successBox: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    backgroundColor: "rgba(255, 215, 100, 0.08)",
  },
  successTitle: {
    fontFamily: "Harry",
    fontSize: 20,
    color: colors.gold,
    marginBottom: 4,
    textAlign: "center",
  },
  successText: {
    color: colors.softGold,
    fontSize: 15,
    textAlign: "center",
  },
  card: {
    marginTop: 18,
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
    marginBottom: 4,
  },
  cardSub: {
    color: colors.softGold,
    fontSize: 12,
    marginBottom: 12,
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
  btn2: {
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 14,
  },
  btn2Text: {
    fontFamily: "Harry",
    fontSize: 18,
    color: colors.gold,
    textAlign: "center",
  },
  note: {
    marginTop: 14,
    textAlign: "center",
    color: colors.softGold,
  },
  back: {
    marginTop: 20,
    textAlign: "center",
    color: colors.softGold,
  },
  label: {
    color: colors.softGold,
    marginTop: 14,
    marginBottom: 6,
  },
  button: {
    backgroundColor: colors.gold,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    fontFamily: "Harry",
    fontSize: 18,
    color: "#2A1600",
    textAlign: "center",
  },
  input1: {
  padding: 14,
  color: colors.text,
},
});

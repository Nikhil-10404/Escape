import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MagicalAlert from "../src/components/MagicalAlert";
import {
    getSessions,
    logout,
    logoutAllSessions,
    logoutSession,
} from "../src/services/auth";
import { colors } from "../src/theme/colors";

export default function ManageDevices() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  async function load() {
    try {
      setLoading(true);
      const data = await getSessions();
      setSessions(data.sessions);
      setCurrentSessionId(data.currentSessionId);
    } catch (err: any) {
       if (err?.__rateLimited) {
    return;
  }
      await logout();
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleLogoutDevice(sessionId: string) {
    try {
      await logoutSession(sessionId);

      // ✅ if user logs out current device -> kick out
      if (sessionId === currentSessionId) {
        await logout();
        router.replace("/login");
        return;
      }

      setAlert({
        visible: true,
        title: "🪄 Device Banished",
        message: "That device has been removed from the castle.",
      });

      load();
    } catch (err: any) {
       if (err?.__rateLimited) {
    return;
  }
      setAlert({
        visible: true,
        title: "Dark Magic Interference",
        message: err?.response?.data?.error || "Failed to logout device",
      });
    }
  }

  async function handleLogoutAll() {
    try {
      await logoutAllSessions();

      setAlert({
        visible: true,
        title: "🛡️ Security Spell Cast",
        message: "All other devices have been logged out.",
      });

      load();
    } catch (err: any) {
       if (err?.__rateLimited) {
    return;
  }
      setAlert({
        visible: true,
        title: "Dark Magic Interference",
        message: err?.response?.data?.error || "Failed to logout all devices",
      });
    }
  }

  // ✅ Loading Screen
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Summoning your active devices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          sessions.length <= 2 && { flexGrow: 1, justifyContent: "center" }, // ✅ CENTER MAGIC
        ]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>✨ ACTIVE DEVICES</Text>
            <Text style={styles.subtitle}>
              These are the doors open to your account
            </Text>

            <TouchableOpacity
              style={styles.logoutAllBtn}
              onPress={handleLogoutAll}
            >
              <Text style={styles.logoutAllText}>LOGOUT OTHER DEVICES ⚡</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const isCurrent = item._id === currentSessionId;
          return (
            <View style={[styles.card, isCurrent && styles.currentCard]}>
              <Text style={styles.deviceName}>
                {item.deviceName} {isCurrent ? "✅ (This device)" : ""}
              </Text>

              <Text style={styles.deviceInfo}>
                Platform: {item.platform} • App: {item.appVersion || "1.0.0"}
              </Text>

              <Text style={styles.deviceInfo}>
  Location:{" "}
  {item.location?.city
    ? `${item.location.city}, ${item.location.region}, ${item.location.country}`
    : "Unknown"}
</Text>

<Text style={styles.deviceInfo}>IP: {item.ip || "Unknown"}</Text>

              <Text style={styles.deviceInfo}>
                Last used: {new Date(item.lastUsedAt).toLocaleString()}
              </Text>

              <TouchableOpacity
                style={[styles.kickBtn, isCurrent && { opacity: 0.7 }]}
                onPress={() => handleLogoutDevice(item._id)}
              >
                <Text style={styles.kickText}>
                  {isCurrent ? "LOGOUT THIS DEVICE 🧹" : "KICK THIS DEVICE 🚪"}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />

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
  root: {
    flex: 1,
    backgroundColor: "#070A14",
  },

  // ✅ Loading UI
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

  // ✅ FlatList spacing
  listContainer: {
    paddingHorizontal: 22,
    paddingTop: 35,
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginBottom: 22,
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
    marginBottom: 18,
  },

  logoutAllBtn: {
    width: "100%",
    backgroundColor: colors.gold,
    paddingVertical: 16,
    borderRadius: 18,
  },

  logoutAllText: {
    fontFamily: "Harry",
    fontSize: 20,
    color: "#2A1600",
    textAlign: "center",
  },

  card: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  // ✅ Highlight current device slightly
  currentCard: {
    backgroundColor: "rgba(255, 215, 100, 0.07)",
  },

  deviceName: {
    fontFamily: "Harry",
    fontSize: 20,
    color: colors.gold,
    marginBottom: 8,
  },

  deviceInfo: {
    color: colors.softGold,
    fontSize: 12,
    marginBottom: 5,
  },

  kickBtn: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  kickText: {
    color: colors.gold,
    textAlign: "center",
    fontFamily: "Harry",
    fontSize: 18,
  },
});

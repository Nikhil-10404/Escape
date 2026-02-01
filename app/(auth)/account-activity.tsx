import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import MagicalAlert from "../src/components/MagicalAlert";
import { colors } from "../src/theme/colors";
import { getAuditLogs } from "../src/services/auth";

type AuditOutcome = "SUCCESS" | "FAIL" | "BLOCKED" | "INFO";
type FilterKey = "ALL" | "SAFE" | "FAILED" | "BLOCKED" | "INFO";
type DayFilter = "ALL" | "Today" | "Yesterday" | "Older";

type AuditLog = {
  _id: string;
  type: string;
  outcome: AuditOutcome;
  message?: string;
  reasons?: string[];
  ip?: string;
  device?: {
    deviceName?: string;
    platform?: string;
    appVersion?: string;
  };
  location?: {
    city?: string;
    region?: string;
    country?: string;
  };
  createdAt: string;
};

type Item =
  | { kind: "header"; id: string; title: string }
  | { kind: "log"; id: string; log: AuditLog };

function formatTime(ts: string) {
  const d = new Date(ts);

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function startOfLocalDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDayBucket(date: Date): DayFilter {
  const logDay = startOfLocalDay(date);

  const today = startOfLocalDay(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (logDay.getTime() === today.getTime()) return "Today";
  if (logDay.getTime() === yesterday.getTime()) return "Yesterday";
  return "Older";
}

function getEventTitle(type: string) {
  switch (type) {
    case "LOGIN_SUCCESS":
      return "✅ Entry Granted";
    case "LOGIN_FAILED":
      return "❌ Entry Denied";
    case "LOGIN_REQUIRES_2FA":
      return "🛡️ 2FA Required";
    case "REFRESH_ROTATED":
      return "♻️ Session Spell Renewed";
    case "REFRESH_REUSE_DETECTED":
      return "🧿 Token Reuse Blocked";
    case "LOGOUT":
      return "🚪 Exited the Castle";
    case "LOGOUT_ALL":
      return "🔥 Cleared All Devices";
    case "LOGOUT_DEVICE":
      return "🧹 Removed a Device";
    case "TOTP_ENABLED":
      return "🛡️ Protego Enabled (2FA ON)";
    case "TOTP_DISABLED":
      return "⚠️ Shield Removed (2FA OFF)";
    case "SUSPICIOUS_LOGIN_FLAGGED":
      return "⚠️ Dark Magic Detected";
    case "DEVICE_MISMATCH_BLOCKED":
      return "🧿 Blocked: Device Mismatch";
    default:
      return type;
  }
}

function getOutcomeBadge(outcome: AuditOutcome) {
  switch (outcome) {
    case "SUCCESS":
      return { label: "SAFE", color: "#2ECC71" };
    case "FAIL":
      return { label: "FAILED", color: "#E74C3C" };
    case "BLOCKED":
      return { label: "BLOCKED", color: "#F39C12" };
    default:
      return { label: "INFO", color: "#60a5fa" };
  }
}

function getLocationText(loc?: AuditLog["location"]) {
  const city = loc?.city?.trim();
  const region = loc?.region?.trim();
  const country = loc?.country?.trim();
  const parts = [city, region, country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Unknown Realm";
}

function matchesFilter(outcome: AuditOutcome, filter: FilterKey) {
  if (filter === "ALL") return true;
  if (filter === "SAFE") return outcome === "SUCCESS";
  if (filter === "FAILED") return outcome === "FAIL";
  if (filter === "BLOCKED") return outcome === "BLOCKED";
  if (filter === "INFO") return outcome === "INFO";
  return true;
}

export default function AccountActivityScreen() {
  const router = useRouter();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [dayFilter, setDayFilter] = useState<DayFilter>("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [filter, setFilter] = useState<FilterKey>("ALL");
  const [filterOpen, setFilterOpen] = useState(false);

  const [retentionDays, setRetentionDays] = useState<number>(30);

  const [alert, setAlert] = useState({
    visible: false,
    title: "",
    message: "",
  });

  async function loadFirstPage() {
    try {
      setLoading(true);
      const data = await getAuditLogs(40);
      setLogs(data.logs || []);
      setNextCursor(data.nextCursor || null);

      if (typeof (data as any)?.retentionDays === "number") {
        setRetentionDays((data as any).retentionDays);
      }
    } catch (err: any) {
      setAlert({
        visible: true,
        title: "Dark Magic Interference",
        message:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load activity scroll",
      });
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try {
      setRefreshing(true);
      const data = await getAuditLogs(40);
      setLogs(data.logs || []);
      setNextCursor(data.nextCursor || null);

      if (typeof (data as any)?.retentionDays === "number") {
        setRetentionDays((data as any).retentionDays);
      }
    } catch (err: any) {
      setAlert({
        visible: true,
        title: "Dark Magic Interference",
        message:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to refresh activity scroll",
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;

    try {
      setLoadingMore(true);
      const data = await getAuditLogs(40, nextCursor);
      const newLogs: AuditLog[] = data.logs || [];

      // ✅ avoid duplicates
      const existingIds = new Set(logs.map((x) => x._id));
      const merged = [...logs, ...newLogs.filter((x) => !existingIds.has(x._id))];

      setLogs(merged);
      setNextCursor(data.nextCursor || null);
    } catch (err: any) {
      console.log("loadMore audit logs failed:", err?.message || err);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
  }, []);

const filteredLogs = useMemo(() => {
  return logs.filter((log) => {
    // outcome filter
    if (!matchesFilter(log.outcome, filter)) return false;

    // day filter
    if (dayFilter === "ALL") return true;

    return getDayBucket(new Date(log.createdAt)) === dayFilter;
  });
}, [logs, filter, dayFilter]);


const listItems = useMemo(() => {
  return filteredLogs.map((log) => ({
    kind: "log" as const,
    id: log._id,
    log,
  }));
}, [filteredLogs]);


  const filterLabel = useMemo(() => {
    if (filter === "ALL") return "All";
    if (filter === "SAFE") return "Safe";
    if (filter === "FAILED") return "Failed";
    if (filter === "BLOCKED") return "Blocked";
    if (filter === "INFO") return "Info";
    return "All";
  }, [filter]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={styles.loadingText}>Unrolling your Security Scroll...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.overlay}>
        <Text style={styles.title}>📜 Account Activity</Text>
        <Text style={styles.subtitle}>
          The Marauder’s Map tracks your account. Logs vanish after {retentionDays} days ✨
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.smallBtn} onPress={() => setFilterOpen(true)}>
            <Text style={styles.smallBtnText}>Filter: {filterLabel} 🧪</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.smallBtn} onPress={() => router.back()}>
            <Text style={styles.smallBtnText}>Return 🏰</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statText}>Total: {logs.length}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statText}>Showing: {filteredLogs.length}</Text>
          </View>
        </View>

        <View style={styles.dayFilterRow}>
  {(["ALL", "Today", "Yesterday", "Older"] as DayFilter[]).map((d) => (
    <TouchableOpacity
      key={d}
      style={[
        styles.dayFilterBtn,
        dayFilter === d && styles.dayFilterBtnActive,
      ]}
      onPress={() => setDayFilter(d)}
    >
      <Text
        style={[
          styles.dayFilterText,
          dayFilter === d && styles.dayFilterTextActive,
        ]}
      >
        {d}
      </Text>
    </TouchableOpacity>
  ))}
</View>

        <FlatList
          data={listItems}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.gold}
            />
          }
          onEndReachedThreshold={0.55}
          onEndReached={loadMore}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>✅ Nothing Here</Text>
              <Text style={styles.emptyText}>
                Your scroll has no entries for this filter.
              </Text>

              <TouchableOpacity
                style={[styles.smallBtn, { marginTop: 12 }]}
                onPress={() => setFilter("ALL")}
              >
                <Text style={styles.smallBtnText}>Reset Filter ✨</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator color={colors.gold} />
                <Text style={styles.footerText}>Summoning more traces...</Text>
              </View>
            ) : (
              <View style={{ height: 10 }} />
            )
          }
          renderItem={({ item }) => {
            const log = item.log;
            const badge = getOutcomeBadge(log.outcome);
            const title = getEventTitle(log.type);

            const deviceLine =
              log.device?.deviceName || log.device?.platform
                ? `${log.device?.deviceName || "Unknown Device"} • ${
                    log.device?.platform || "unknown"
                  }${log.device?.appVersion ? ` • v${log.device.appVersion}` : ""}`
                : "Unknown Device • unknown";

            const ipLine = log.ip ? log.ip : "Unknown";
            const locLine = getLocationText(log.location);

            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle}>{title}</Text>

                  <View style={[styles.badge, { borderColor: badge.color }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.timeText}>{formatTime(log.createdAt)}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>🪄 Device:</Text>
                  <Text style={styles.infoValue}>{deviceLine}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>🌍 Realm:</Text>
                  <Text style={styles.infoValue}>{locLine}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>🧿 IP:</Text>
                  <Text style={styles.infoValue}>{ipLine}</Text>
                </View>

                {!!log.message && (
                  <View style={styles.msgBox}>
                    <Text style={styles.msgText}>{log.message}</Text>
                  </View>
                )}

                {Array.isArray(log.reasons) && log.reasons.length > 0 && (
                  <View style={styles.reasonBox}>
                    <Text style={styles.reasonTitle}>⚠️ Reasons</Text>
                    <Text style={styles.reasonText}>{log.reasons.join(" • ")}</Text>
                  </View>
                )}
              </View>
            );
          }}
        />

        {/* ✅ Filter Modal */}
        <Modal transparent visible={filterOpen} animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>🧪 Filter the Scroll</Text>
              <Text style={styles.modalSub}>
                Choose which traces you want to reveal.
              </Text>

              {(
                [
                  { key: "ALL", label: "All Traces" },
                  { key: "SAFE", label: "Safe (Success)" },
                  { key: "FAILED", label: "Failed Attempts" },
                  { key: "BLOCKED", label: "Blocked Dark Magic" },
                  { key: "INFO", label: "Information" },
                ] as { key: FilterKey; label: string }[]
              ).map((x) => (
                <TouchableOpacity
                  key={x.key}
                  style={[
                    styles.modalBtn,
                    filter === x.key && { backgroundColor: "rgba(255,215,100,0.10)" },
                  ]}
                  onPress={() => {
                    setFilter(x.key);
                    setFilterOpen(false);
                  }}
                >
                  <Text style={styles.modalBtnText}>{x.label}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setFilterOpen(false)}
              >
                <Text style={styles.modalCloseText}>Close ✨</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <MagicalAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          buttonText="Understood ⚡"
          onClose={() => setAlert({ ...alert, visible: false })}
        />
      </View>
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
    paddingHorizontal: 18,
    paddingTop: 32,
    paddingBottom: 16,
  },

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
    marginBottom: 14,
    fontSize: 13,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  smallBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gold,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  smallBtnText: {
    fontFamily: "Harry",
    fontSize: 15,
    color: colors.gold,
    textAlign: "center",
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  statPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,215,100,0.35)",
    backgroundColor: "rgba(255,215,100,0.06)",
    paddingVertical: 8,
    borderRadius: 999,
  },
  statText: {
    textAlign: "center",
    color: colors.softGold,
    fontSize: 12,
  },

  emptyBox: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 16,
    padding: 16,
    marginTop: 18,
    backgroundColor: "rgba(255, 215, 100, 0.08)",
  },
  emptyTitle: {
    fontFamily: "Harry",
    fontSize: 22,
    color: colors.gold,
    textAlign: "center",
    marginBottom: 6,
  },
  emptyText: {
    color: colors.softGold,
    textAlign: "center",
    fontSize: 13,
  },

  dayHeader: {
    marginTop: 8,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,215,100,0.30)",
    backgroundColor: "rgba(255,215,100,0.06)",
  },
  dayHeaderText: {
    fontFamily: "Harry",
    fontSize: 18,
    color: colors.gold,
  },

  card: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  cardTitle: {
    flex: 1,
    fontFamily: "Harry",
    fontSize: 18,
    color: colors.gold,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  badgeText: {
    fontFamily: "Harry",
    fontSize: 14,
  },

  timeText: {
    marginTop: 6,
    color: colors.softGold,
    fontSize: 12,
  },

  infoRow: {
    flexDirection: "row",
    marginTop: 8,
  },
  infoKey: {
    width: 86,
    color: colors.softGold,
    fontSize: 12,
  },
  infoValue: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
  },

  msgBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 215, 100, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 215, 100, 0.20)",
  },
  msgText: {
    color: colors.softGold,
    fontSize: 12,
  },

  reasonBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255, 100, 100, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 100, 100, 0.25)",
  },
  reasonTitle: {
    fontFamily: "Harry",
    fontSize: 16,
    color: colors.gold,
    marginBottom: 6,
  },
  reasonText: {
    color: colors.softGold,
    fontSize: 12,
  },

  footerText: {
    marginTop: 8,
    textAlign: "center",
    color: colors.softGold,
    fontSize: 12,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: "rgba(8,10,25,0.95)",
    borderRadius: 18,
    padding: 16,
  },
  modalTitle: {
    fontFamily: "Harry",
    fontSize: 24,
    color: colors.gold,
    textAlign: "center",
  },
  modalSub: {
    marginTop: 8,
    marginBottom: 14,
    textAlign: "center",
    color: colors.softGold,
    fontSize: 12,
  },
  modalBtn: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  modalBtnText: {
    fontFamily: "Harry",
    fontSize: 16,
    color: colors.gold,
    textAlign: "center",
  },
  modalCloseBtn: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  modalCloseText: {
    fontFamily: "Harry",
    fontSize: 16,
    color: colors.gold,
    textAlign: "center",
  },
  dayFilterRow: {
  flexDirection: "row",
  gap: 8,
  marginBottom: 10,
},

dayFilterBtn: {
  flex: 1,
  paddingVertical: 8,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: "rgba(255,215,100,0.35)",
  backgroundColor: "rgba(255,255,255,0.04)",
},

dayFilterBtnActive: {
  backgroundColor: "rgba(255,215,100,0.18)",
},

dayFilterText: {
  textAlign: "center",
  color: colors.softGold,
  fontSize: 12,
},

dayFilterTextActive: {
  color: colors.gold,
  fontWeight: "bold",
},

});

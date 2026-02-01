import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { colors } from "../theme/colors";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  retryAfter: number;
  onClose: () => void;
};

export default function RateLimitAlert({
  visible,
  title,
  message,
  retryAfter,
  onClose,
}: Props) {
  const [seconds, setSeconds] = useState(retryAfter);

  useEffect(() => {
    if (!visible) return;

    setSeconds(retryAfter);

    const timer = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, retryAfter]);

   const unlocked = seconds === 0;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <Text style={styles.title}>
            {unlocked ? "✨ Spell Restored" : title}
          </Text>

          <Text style={styles.message}>
            {unlocked
              ? "You may now cast your spell again. Please proceed carefully."
              : message}
          </Text>

          {seconds > 0 ? (
            <Text style={styles.timer}>
              ⏳ Try again in {seconds}s
            </Text>
          ) : (
            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>
                🪄 Cast Spell Again
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "85%",
    backgroundColor: "#0c1020",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: colors.gold,
  },
  title: {
    fontFamily: "Harry",
    fontSize: 26,
    color: colors.gold,
    textAlign: "center",
    marginBottom: 10,
  },
  message: {
    color: colors.softGold,
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
  },
  timer: {
    color: colors.softGold,
    textAlign: "center",
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    alignSelf: "center",
    backgroundColor: colors.gold,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 14,
  },
  buttonText: {
    fontFamily: "Harry",
    fontSize: 18,
    color: "#2A1600",
  },
});

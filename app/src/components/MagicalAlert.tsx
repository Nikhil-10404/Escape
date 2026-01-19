import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { colors } from "../theme/colors";

export default function MagicalAlert({
  visible,
  title,
  message,
  buttonText = "✨ Continue",
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.box,
            { transform: [{ scale }], opacity },
          ]}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
          <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
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
    marginBottom: 12,
  },
  message: {
    color: colors.softGold,
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
  },
  button: {
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

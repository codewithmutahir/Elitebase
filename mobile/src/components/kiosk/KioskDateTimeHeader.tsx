// REFACTORED: portrait-responsive + Reanimated unified
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { kioskTheme } from "@/constants/kioskTheme";
import { kioskSpace } from "@/constants/kioskLayout";
import { useKioskTypography } from "@/hooks/useKioskTypography";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatTime12(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type KioskDateTimeHeaderProps = {
  variant?: "large" | "compact";
};

export function KioskDateTimeHeader({ variant = "large" }: KioskDateTimeHeaderProps) {
  const [now, setNow] = useState(() => new Date());
  const type = useKioskTypography();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (variant === "compact") {
    return (
      <Text style={[styles.compactTime, { fontSize: type.base }]}>{formatTime12(now)}</Text>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.timeLarge, { fontSize: type.largeHeading + 6 }]}>
        {formatTime(now)}
      </Text>
      <Text style={[styles.date, { fontSize: type.base - 1 }]}>{formatDate(now)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
    gap: kioskSpace.xs,
  },
  timeLarge: {
    fontFamily: "Inter_700Bold",
    color: kioskTheme.text,
    letterSpacing: -0.5,
  },
  date: {
    fontFamily: "Inter_400Regular",
    color: kioskTheme.textMuted,
  },
  compactTime: {
    fontFamily: "Inter_400Regular",
    color: kioskTheme.textMuted,
  },
});

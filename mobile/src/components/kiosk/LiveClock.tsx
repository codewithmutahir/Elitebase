import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type LiveClockProps = {
  /** Header mode: time only, smaller — avoids competing with workflow. */
  compact?: boolean;
};

export function LiveClock({ compact = false }: LiveClockProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (compact) {
    return (
      <View style={styles.compactWrap}>
        <Text style={styles.compactTime}>{formatTime(now)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.time}>{formatTime(now)}</Text>
      <Text style={styles.date}>{formatDate(now)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "flex-end" },
  time: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#0F172A",
  },
  date: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#64748B",
  },
  compactWrap: { alignItems: "flex-end" },
  compactTime: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#64748B",
    letterSpacing: 0.2,
  },
});

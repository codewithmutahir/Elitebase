import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ScreenBackground } from "@/components/ScreenBackground";
import { KioskFrame } from "@/components/kiosk/KioskFrame";
import { T } from "@/constants/tokens";
import { useKioskLayout } from "@/hooks/useKioskLayout";
import {
  avatarColor,
  employeeInitials,
  formatClockTime,
} from "@/lib/format";
import { createIdempotencyKey } from "@/lib/idempotency";
import {
  clockAction,
  getClockActionErrorMessage,
  getEmployeeStatus,
  getKioskApiErrorMessage,
  isInvalidTransitionError,
} from "@/lib/kiosk";
import { hapticMedium, onPressHaptic } from "@/lib/kioskUi";
import type { AttendanceActionType, RootStackParamList } from "@/types";

type ActionRoute = RouteProp<RootStackParamList, "Action">;
type ActionNavigation = NativeStackNavigationProp<RootStackParamList, "Action">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatStatusLine(
  isClockedIn: boolean,
  onBreak: boolean,
  clockedInAt: string | null
): { text: string; color: string } {
  if (onBreak) {
    return { text: "On break", color: T.warning };
  }
  if (isClockedIn && clockedInAt) {
    const time = formatClockTime(new Date(clockedInAt));
    return { text: `Clocked in at ${time}`, color: T.success };
  }
  return { text: "Not clocked in", color: T.textMuted };
}

function weekdayTime(date: Date) {
  const day = date.toLocaleDateString("en-US", { weekday: "long" });
  return `${day} · ${formatClockTime(date)}`;
}

export function ActionScreen() {
  const route = useRoute<ActionRoute>();
  const navigation = useNavigation<ActionNavigation>();
  const { employee, faceVerifyToken } = route.params;

  const [now, setNow] = useState(() => new Date());
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState<AttendanceActionType | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [clockedInAt, setClockedInAt] = useState<string | null>(null);

  const badgeY = useSharedValue(-20);
  const badgeOpacity = useSharedValue(0);
  const avatarScale = useSharedValue(0);

  const initials = employeeInitials(employee.full_name);
  const avatarBg = avatarColor(employee.full_name);
  const statusLine = formatStatusLine(isClockedIn, onBreak, clockedInAt);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: badgeY.value }],
    opacity: badgeOpacity.value,
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  useEffect(() => {
    badgeY.value = withTiming(0, { duration: 500, easing: T.easing });
    badgeOpacity.value = withTiming(1, { duration: 500, easing: T.easing });
    avatarScale.value = withSequence(
      withSpring(1.2, T.spring),
      withSpring(1, T.spring)
    );
  }, [avatarScale, badgeOpacity, badgeY]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const loadStatus = useCallback(async () => {
    setLoadingStatus(true);
    setError(null);
    try {
      const status = await getEmployeeStatus(employee.id);
      setIsClockedIn(status.is_clocked_in);
      setOnBreak(status.on_break);
      setClockedInAt(status.clocked_in_at);
    } catch (err) {
      setError(
        getKioskApiErrorMessage(err, "Could not load your status. Try again.")
      );
    } finally {
      setLoadingStatus(false);
    }
  }, [employee.id]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleAction = useCallback(
    async (type: AttendanceActionType) => {
      if (submitting) return;
      void hapticMedium();
      setSubmitting(type);
      setError(null);

      const idempotencyKey = createIdempotencyKey();

      try {
        const result = await clockAction(employee.id, type, {
          idempotencyKey,
          faceVerifyToken,
        });
        navigation.replace("Success", {
          employee,
          actionType: type,
          timestamp: result.attendance.timestamp,
        });
      } catch (err) {
        if (isInvalidTransitionError(err)) {
          setError(
            getClockActionErrorMessage(
              err,
              "That action is not allowed right now."
            )
          );
          await loadStatus();
          setSubmitting(null);
          return;
        }
        setError(
          getClockActionErrorMessage(err, "Could not record attendance.")
        );
        setSubmitting(null);
      }
    },
    [employee, faceVerifyToken, loadStatus, navigation, submitting]
  );

  const breakAction: AttendanceActionType = onBreak
    ? "break_end"
    : "break_start";
  const breakLabel = onBreak ? "End Break" : "Start Break";
  const layout = useKioskLayout();

  const identity = (
    <View style={styles.top}>
      <Animated.View style={[styles.verifiedBadge, badgeStyle]}>
        <Feather name="check-circle" size={16} color={T.success} />
        <Text style={styles.verifiedText}>IDENTITY VERIFIED</Text>
      </Animated.View>

      <Animated.View
        style={[styles.avatar, { backgroundColor: avatarBg }, avatarStyle]}
      >
        <Text style={styles.avatarText}>{initials}</Text>
      </Animated.View>

      <Text style={styles.name}>{employee.full_name}</Text>
      <Text style={styles.timeLine}>{weekdayTime(now)}</Text>

      {loadingStatus ? (
        <ActivityIndicator color={T.primary} size="small" />
      ) : (
        <Text style={[styles.status, { color: statusLine.color }]}>
          {statusLine.text}
        </Text>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );

  const actions = (
    <View
      style={[
        styles.actions,
        layout.isLandscape && styles.actionsLandscape,
      ]}
    >
      <ActionButton
        label={submitting === "clock_in" ? "..." : "Clock In"}
        icon="log-in"
        bg={isClockedIn ? T.surfaceHi : T.success}
        disabled={isClockedIn || loadingStatus || submitting !== null}
        onPress={() => void handleAction("clock_in")}
      />
      <ActionButton
        label={submitting === "clock_out" ? "..." : "Clock Out"}
        icon="log-out"
        bg={!isClockedIn ? T.surfaceHi : T.error}
        disabled={!isClockedIn || loadingStatus || submitting !== null}
        onPress={() => void handleAction("clock_out")}
      />
      <ActionButton
        label={submitting === breakAction ? "..." : breakLabel}
        icon="coffee"
        bg={onBreak ? T.warning : T.surfaceHi}
        bordered={!onBreak}
        disabled={!isClockedIn || loadingStatus || submitting !== null}
        onPress={() => void handleAction(breakAction)}
        compact
      />
      <ActionButton
        label="Request Leave"
        icon="calendar"
        bg={T.surfaceHi}
        bordered
        disabled={loadingStatus || submitting !== null}
        onPress={() =>
          navigation.navigate("LeaveRequest", { employee })
        }
        compact
      />
    </View>
  );

  return (
    <ScreenBackground>
      <KioskFrame maxWidth={layout.isLandscape ? 880 : layout.contentMaxWidth}>
        <View style={styles.root}>
          <View
            style={[
              styles.body,
              layout.isLandscape && styles.bodyLandscape,
            ]}
          >
            {identity}
            {actions}
          </View>

          <Pressable
            onPress={() => navigation.replace("Idle")}
            onPressIn={() => onPressHaptic("light")}
            hitSlop={12}
            style={({ pressed }) => [styles.notYou, pressed && styles.pressed]}
          >
            <Text style={styles.notYouText}>Not you?</Text>
          </Pressable>
        </View>
      </KioskFrame>
    </ScreenBackground>
  );
}

function ActionButton({
  label,
  icon,
  bg,
  disabled,
  onPress,
  bordered,
  compact,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  bg: string;
  disabled: boolean;
  onPress: () => void;
  bordered?: boolean;
  compact?: boolean;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        if (!disabled) {
          scale.value = withSpring(0.97, T.spring);
          onPressHaptic("medium");
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, T.spring);
      }}
      style={[
        compact ? styles.breakBtn : styles.actionBtn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : 1 },
        bordered && styles.bordered,
        animStyle,
      ]}
    >
      <Feather name={icon} size={compact ? 20 : 22} color={T.text} />
      <Text style={compact ? styles.breakText : styles.actionText}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, minHeight: 0 },
  bodyLandscape: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  top: { paddingTop: 8, alignItems: "center", minWidth: 240, flexShrink: 1 },
  verifiedBadge: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "rgba(34,197,94,0.12)",
    borderRadius: T.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  verifiedText: { ...T.label, color: T.success },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    borderWidth: 2,
    borderColor: T.primary,
  },
  avatarText: { ...T.h2, fontSize: 28, color: "#fff" },
  name: {
    ...T.hero,
    fontSize: 32,
    textAlign: "center",
    marginTop: 16,
  },
  timeLine: { ...T.body, fontSize: 15, marginTop: 6 },
  status: { ...T.body, fontSize: 14, marginTop: 8 },
  error: { ...T.body, color: T.error, marginTop: 8, textAlign: "center" },
  actions: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
    paddingVertical: 24,
    width: "100%",
    minWidth: 240,
  },
  actionsLandscape: {
    flex: 1,
    maxWidth: 400,
    paddingVertical: 8,
  },
  actionBtn: {
    minHeight: 72,
    borderRadius: T.radius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  breakBtn: {
    minHeight: 60,
    borderRadius: T.radius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  bordered: {
    borderWidth: 1,
    borderColor: T.border,
  },
  actionText: { ...T.btn, fontSize: 18, color: T.text },
  breakText: { ...T.btn, fontSize: 16, color: T.text },
  notYou: {
    width: "100%",
    paddingBottom: 8,
    minHeight: 44,
    justifyContent: "center",
  },
  notYouText: { ...T.body, color: T.textMuted, textAlign: "center" },
  pressed: { opacity: 0.85 },
});

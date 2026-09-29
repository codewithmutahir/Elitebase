import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ScreenBackground } from "@/components/ScreenBackground";
import { KioskFrame } from "@/components/kiosk/KioskFrame";
import { T } from "@/constants/tokens";
import { useKioskLayout } from "@/hooks/useKioskLayout";
import {
  submitLeaveRequest,
  getKioskApiErrorMessage,
} from "@/lib/kiosk";
import { hapticMedium, onPressHaptic } from "@/lib/kioskUi";
import type { LeaveType, RootStackParamList } from "@/types";

type LeaveRoute = RouteProp<RootStackParamList, "LeaveRequest">;
type LeaveNav = NativeStackNavigationProp<RootStackParamList, "LeaveRequest">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function todayDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function LeaveRequestScreen() {
  const route = useRoute<LeaveRoute>();
  const navigation = useNavigation<LeaveNav>();
  const { employee } = route.params;
  const layout = useKioskLayout();

  const [leaveType, setLeaveType] = useState<LeaveType>("paid_leave");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    void hapticMedium();
    setSubmitting(true);
    setError(null);

    try {
      await submitLeaveRequest(
        employee.id,
        leaveType,
        todayDateString(),
        todayDateString(),
        reason.trim() || undefined
      );
      navigation.replace("LeaveSuccess", { employee, leaveType });
    } catch (err) {
      setError(
        getKioskApiErrorMessage(err, "Could not submit leave request.")
      );
      setSubmitting(false);
    }
  }, [employee, leaveType, navigation, reason, submitting]);

  return (
    <ScreenBackground>
      <KioskFrame maxWidth={layout.isLandscape ? 640 : layout.contentMaxWidth}>
        <View style={styles.root}>
          <Text style={styles.heading}>Request Leave</Text>
          <Text style={styles.name}>{employee.full_name}</Text>

          <View style={styles.typeRow}>
            <TypeButton
              label="Paid Leave"
              active={leaveType === "paid_leave"}
              onPress={() => setLeaveType("paid_leave")}
            />
            <TypeButton
              label="Unpaid Leave"
              active={leaveType === "unpaid_leave"}
              onPress={() => setLeaveType("unpaid_leave")}
            />
          </View>

          <TextInput
            style={styles.input}
            placeholder="Reason (optional)"
            placeholderTextColor={T.textMuted}
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={200}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[
              styles.submitBtn,
              submitting && styles.disabled,
            ]}
            disabled={submitting}
            onPress={handleSubmit}
            onPressIn={() => onPressHaptic("medium")}
          >
            <Feather name="send" size={20} color={T.text} />
            <Text style={styles.submitText}>
              {submitting ? "Submitting…" : "Submit Request"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.back}
            onPress={() => navigation.goBack()}
            onPressIn={() => onPressHaptic("light")}
            hitSlop={12}
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        </View>
      </KioskFrame>
    </ScreenBackground>
  );
}

function TypeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, T.spring);
        onPressHaptic("light");
      }}
      onPressOut={() => {
        scale.value = withSpring(1, T.spring);
      }}
      style={[
        styles.typeBtn,
        active && styles.typeBtnActive,
        animStyle,
      ]}
    >
      <Text
        style={[
          styles.typeBtnText,
          active && styles.typeBtnTextActive,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  heading: {
    ...T.hero,
    fontSize: 28,
    textAlign: "center",
  },
  name: {
    ...T.body,
    fontSize: 16,
    color: T.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
  typeRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 32,
    width: "100%",
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: T.radius.xl,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surfaceHi,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBtnActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  typeBtnText: {
    ...T.btn,
    fontSize: 15,
    color: T.textMuted,
  },
  typeBtnTextActive: {
    color: T.text,
  },
  input: {
    marginTop: 20,
    width: "100%",
    minHeight: 80,
    borderRadius: T.radius.lg,
    borderWidth: 1,
    borderColor: T.border,
    backgroundColor: T.surfaceHi,
    color: T.text,
    fontSize: 15,
    padding: 16,
    textAlignVertical: "top",
  },
  error: {
    ...T.body,
    color: T.error,
    marginTop: 12,
    textAlign: "center",
  },
  submitBtn: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    minHeight: 60,
    borderRadius: T.radius.xl,
    backgroundColor: T.success,
  },
  submitText: {
    ...T.btn,
    fontSize: 17,
    color: T.text,
  },
  disabled: { opacity: 0.5 },
  back: {
    marginTop: 20,
    paddingVertical: 10,
  },
  backText: {
    ...T.body,
    color: T.textMuted,
    textAlign: "center",
  },
});

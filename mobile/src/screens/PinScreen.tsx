import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { NumPad } from "@/components/NumPad";
import { ScreenBackground } from "@/components/ScreenBackground";
import { T } from "@/constants/tokens";
import axios from "axios";
import {
  getEmployeeByPin,
  getPinLookupErrorMessage,
  toKioskEmployee,
} from "@/lib/kiosk";
import { getTabletConfig } from "@/lib/storage";
import { hapticError, onPressHaptic } from "@/lib/kioskUi";
import type { RootStackParamList, TabletConfig } from "@/types";

type PinNavigation = NativeStackNavigationProp<RootStackParamList, "Pin">;

const PIN_LENGTH = 4;
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 30;

function PinDot({ filled }: { filled: boolean }) {
  const scale = useSharedValue(filled ? 1 : 0.6);

  useEffect(() => {
    if (filled) {
      scale.value = withSequence(
        withSpring(1.4, T.spring),
        withSpring(1, T.spring)
      );
    } else {
      scale.value = withSpring(1, T.spring);
    }
  }, [filled, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.pinDot, filled && styles.pinDotFilled, animStyle]}
    />
  );
}

export function PinScreen() {
  const navigation = useNavigation<PinNavigation>();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [config, setConfig] = useState<TabletConfig | null>(null);
  const failedAttemptsRef = useRef(0);
  const lockoutEndsAtRef = useRef<number | null>(null);
  const submitInFlightRef = useRef(false);
  const shakeX = useSharedValue(0);

  const isLockedOut = lockoutRemaining > 0;
  const canEnterPin = !loading && !isLockedOut;
  const showPinError = Boolean(error) && !loading && !isLockedOut;

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    void hapticError();
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  }, [shakeX]);

  const resetPinState = useCallback(() => {
    setPin("");
    setError(null);
    setLoading(false);
    submitInFlightRef.current = false;
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetPinState();
      void getTabletConfig().then(setConfig);
      return () => resetPinState();
    }, [resetPinState])
  );

  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      const endsAt = lockoutEndsAtRef.current;
      if (!endsAt) {
        setLockoutRemaining(0);
        return;
      }
      const remaining = Math.ceil((endsAt - Date.now()) / 1000);
      if (remaining <= 0) {
        lockoutEndsAtRef.current = null;
        failedAttemptsRef.current = 0;
        setLockoutRemaining(0);
        setError(null);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  const startLockout = useCallback(() => {
    lockoutEndsAtRef.current = Date.now() + LOCKOUT_SECONDS * 1000;
    setLockoutRemaining(LOCKOUT_SECONDS);
    setError(`Too many attempts. Try again in ${LOCKOUT_SECONDS}s.`);
    setPin("");
    triggerShake();
  }, [triggerShake]);

  const submitPin = useCallback(
    async (enteredPin: string) => {
      if (
        submitInFlightRef.current ||
        loading ||
        isLockedOut ||
        enteredPin.length !== PIN_LENGTH
      ) {
        return;
      }

      submitInFlightRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const tabletConfig = await getTabletConfig();
        if (!tabletConfig) {
          setError("Tablet not configured. Please set up again.");
          return;
        }

        const { employee } = await getEmployeeByPin(enteredPin);
        const kioskEmployee = toKioskEmployee(employee, tabletConfig.company_id);
        failedAttemptsRef.current = 0;

        if (employee.has_face_descriptor) {
          navigation.replace("FaceScan", { employee: kioskEmployee });
        } else if (employee.face_registered) {
          // Registered before but no usable descriptor (e.g. reset): let them
          // confirm a re-register instead of treating it as first-time consent.
          navigation.replace("FaceRegister", { employee: kioskEmployee });
        } else {
          navigation.replace("Consent", { employee: kioskEmployee });
        }
      } catch (err) {
        const message = getPinLookupErrorMessage(err);
        setError(message);
        setPin("");
        triggerShake();

        const isWrongPin =
          axios.isAxiosError(err) && err.response?.status === 404;
        if (isWrongPin) {
          failedAttemptsRef.current += 1;
          if (failedAttemptsRef.current >= MAX_FAILED_ATTEMPTS) {
            startLockout();
          }
        }
      } finally {
        setLoading(false);
        submitInFlightRef.current = false;
      }
    },
    [isLockedOut, loading, navigation, startLockout, triggerShake]
  );

  useEffect(() => {
    if (pin.length === PIN_LENGTH && canEnterPin) {
      void submitPin(pin);
    }
  }, [pin, canEnterPin, submitPin]);

  function handleDigit(digit: string) {
    if (!canEnterPin || pin.length >= PIN_LENGTH) return;
    setError(null);
    setPin((current) => current + digit);
  }

  function handleBackspace() {
    if (!canEnterPin) return;
    setError(null);
    setPin((current) => current.slice(0, -1));
  }

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (!loading) navigation.navigate("Idle");
        return true;
      });
      return () => sub.remove();
    }, [loading, navigation])
  );

  return (
    <ScreenBackground>
      <View style={styles.root}>
        <View style={styles.topSection}>
          <Pressable
            onPress={() => navigation.navigate("Idle")}
            disabled={loading}
            onPressIn={() => onPressHaptic("light")}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.pressed,
            ]}
            hitSlop={8}
          >
            <Feather name="chevron-left" size={20} color={T.textMuted} />
          </Pressable>

          {config?.company_logo_url ? (
            <Image
              source={{ uri: config.company_logo_url }}
              style={styles.companyLogo}
            />
          ) : (
            <View style={styles.companyLogo}>
              <Feather name="clock" size={22} color={T.primaryDark} />
            </View>
          )}

          <Text style={styles.title}>Enter your PIN</Text>
          <Text style={styles.subtitle}>Clock in or out securely</Text>

          <View style={styles.pinDots}>
            {Array.from({ length: PIN_LENGTH }, (_, i) => (
              <PinDot key={i} filled={i < pin.length} />
            ))}
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={T.primary} size="small" />
              <Text style={styles.loadingText}>Verifying…</Text>
            </View>
          ) : null}

          {showPinError ? (
            <Animated.View style={[styles.errorBox, shakeStyle]}>
              <Feather name="alert-circle" size={14} color={T.error} />
              <Text style={styles.errorText}>
                {isLockedOut
                  ? `Locked. Try again in ${lockoutRemaining}s.`
                  : error ?? "Incorrect PIN"}
              </Text>
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.numpadSection}>
          <NumPad
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            disabled={!canEnterPin}
          />
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  backBtn: {
    position: "absolute",
    top: 56,
    left: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.surfaceHi,
    alignItems: "center",
    justifyContent: "center",
  },
  companyLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  title: { ...T.title, textAlign: "center" },
  subtitle: { ...T.body, textAlign: "center", marginTop: 8 },
  pinDots: {
    flexDirection: "row",
    gap: 16,
    marginTop: 40,
    justifyContent: "center",
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  pinDotFilled: {
    backgroundColor: T.primary,
    borderColor: T.primary,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  loadingText: { ...T.body, fontSize: 13 },
  errorBox: {
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: T.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorText: { ...T.body, fontSize: 13, color: T.error },
  numpadSection: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  pressed: { opacity: 0.85 },
});

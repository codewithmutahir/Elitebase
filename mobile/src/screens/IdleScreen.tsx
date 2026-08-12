import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ScreenBackground } from "@/components/ScreenBackground";
import { T } from "@/constants/tokens";
import { hapticMedium, onPressHaptic } from "@/lib/kioskUi";
import type { RootStackParamList, TabletConfig } from "@/types";
import { getTabletConfig } from "@/lib/storage";
import { validateTabletSession } from "@/lib/tabletSession";
import { warmupFaceService } from "@/lib/faceWarmup";

type IdleNavigation = NativeStackNavigationProp<RootStackParamList, "Idle">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const { width: SCREEN_WIDTH } = Dimensions.get("window");

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDateShort(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function IdleScreen() {
  const navigation = useNavigation<IdleNavigation>();
  const [config, setConfig] = useState<TabletConfig | null>(null);
  const [now, setNow] = useState(() => new Date());
  const btnScale = useSharedValue(1);
  const fpScale = useSharedValue(1);
  const blobY = useSharedValue(0);

  const greeting = useMemo(() => timeGreeting(), []);

  useEffect(() => {
    fpScale.value = withRepeat(
      withSequence(
        withTiming(1.07, { duration: 1500, easing: T.easing }),
        withTiming(1, { duration: 1500, easing: T.easing })
      ),
      -1,
      true
    );
    blobY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 3000, easing: T.easing }),
        withTiming(15, { duration: 3000, easing: T.easing })
      ),
      -1,
      true
    );
  }, [blobY, fpScale]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      async function refreshIdleState() {
        try {
          const valid = await validateTabletSession();
          if (!mounted) return;
          if (!valid) {
            navigation.replace("Setup");
            return;
          }
          const tabletConfig = await getTabletConfig();
          if (mounted) setConfig(tabletConfig);
          void warmupFaceService();
        } catch {
          const tabletConfig = await getTabletConfig();
          if (mounted) setConfig(tabletConfig);
          void warmupFaceService();
        }
      }

      void refreshIdleState();
      return () => {
        mounted = false;
      };
    }, [navigation])
  );

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const fpStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fpScale.value }],
  }));

  const blobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: blobY.value }],
  }));

  const companyName = config?.company_name ?? "Elitebase";

  return (
    <ScreenBackground>
      <View style={styles.top}>
        <View style={styles.brandRow}>
          {config?.company_logo_url ? (
            <Image
              source={{ uri: config.company_logo_url }}
              style={styles.logoCircle}
            />
          ) : (
            <View style={styles.logoCircle}>
              <Feather name="clock" size={18} color={T.primaryDark} />
            </View>
          )}
          <Text style={styles.brandName} numberOfLines={1}>
            {companyName}
          </Text>
        </View>
        <View style={styles.clockCol}>
          <Text style={styles.clockTime}>{formatTime(now)}</Text>
          <Text style={styles.clockDate}>{formatDateShort(now)}</Text>
        </View>
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.blob, blobStyle]} />
        <Animated.View style={[styles.fpWrap, fpStyle]}>
          <Ionicons
            name="finger-print-outline"
            size={60}
            color={T.primary}
          />
        </Animated.View>

        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>Tap below to clock in or out</Text>

        <AnimatedPressable
          onPress={() => navigation.navigate("Pin")}
          onPressIn={() => {
            btnScale.value = withSpring(0.97, T.spring);
            onPressHaptic("medium");
          }}
          onPressOut={() => {
            btnScale.value = withSpring(1, T.spring);
          }}
          style={[styles.cta, btnStyle]}
          accessibilityRole="button"
          accessibilityLabel="Enter PIN"
        >
          <Feather name="lock" size={20} color={T.primaryDark} />
          <Text style={styles.ctaText}>Enter PIN</Text>
        </AnimatedPressable>
      </View>

      <Text style={styles.footer}>Powered by Elitebase</Text>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingTop: 60,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  brandName: { ...T.h2, fontSize: 16, flexShrink: 1 },
  clockCol: { alignItems: "flex-end" },
  clockTime: { ...T.h2, fontSize: 22, color: T.text },
  clockDate: { ...T.body, fontSize: 12, marginTop: 2 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  blob: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: T.primaryGlow,
    opacity: 0.4,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
  },
  fpWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: T.primaryGlow,
    borderWidth: 1,
    borderColor: T.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 12,
  },
  greeting: { ...T.hero, textAlign: "center", marginTop: 32 },
  subtitle: {
    ...T.body,
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    color: T.textMuted,
  },
  cta: {
    marginTop: 48,
    width: SCREEN_WIDTH - 48,
    minHeight: 64,
    borderRadius: T.radius.pill,
    backgroundColor: T.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaText: { ...T.btn, fontSize: 18, color: "#ffffff" },
  footer: {
    paddingBottom: 40,
    ...T.body,
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    textAlign: "center",
  },
});

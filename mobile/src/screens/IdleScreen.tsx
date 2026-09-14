import { useCallback, useEffect, useMemo, useState } from "react";
import {
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
import { useKioskLayout } from "@/hooks/useKioskLayout";
import { hapticMedium, onPressHaptic } from "@/lib/kioskUi";
import type { RootStackParamList, TabletConfig } from "@/types";
import { getTabletConfig } from "@/lib/storage";
import { validateTabletSession } from "@/lib/tabletSession";
import { warmupFaceService } from "@/lib/faceWarmup";

type IdleNavigation = NativeStackNavigationProp<RootStackParamList, "Idle">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
          // Prefer local SecureStore first so a flaky validate never flashes Setup.
          const tabletConfig = await getTabletConfig();
          if (!mounted) return;
          if (!tabletConfig?.tablet_token) {
            navigation.replace("Setup");
            return;
          }
          setConfig(tabletConfig);

          const valid = await validateTabletSession();
          if (!mounted) return;
          if (!valid) {
            // Only navigate away after SecureStore was actually cleared.
            const stillRegistered = await getTabletConfig();
            if (!stillRegistered?.tablet_token) {
              navigation.replace("Setup");
            }
            return;
          }
          const refreshed = await getTabletConfig();
          if (mounted && refreshed) setConfig(refreshed);
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
  const layout = useKioskLayout();
  const compact = layout.isCompact;
  const landscape = layout.isLandscape;
  const blobSize = compact ? 180 : layout.isTablet ? 320 : 280;
  const fpSize = compact ? 88 : 120;
  const fpIcon = compact ? 44 : 60;

  return (
    <ScreenBackground>
      <View
        style={[
          styles.top,
          {
            paddingTop: layout.paddingTop,
            paddingHorizontal: layout.paddingH,
          },
        ]}
      >
        <View style={styles.brandRow}>
          {config?.company_logo_url ? (
            <View
              style={[
                styles.logoBox,
                layout.isTablet && styles.logoBoxTablet,
                compact && styles.logoBoxCompact,
              ]}
            >
              <Image
                source={{ uri: config.company_logo_url }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View
              style={[
                styles.logoFallback,
                layout.isTablet && styles.logoBoxTablet,
                compact && styles.logoBoxCompact,
              ]}
            >
              <Feather
                name="clock"
                size={compact ? 22 : layout.isTablet ? 30 : 24}
                color={T.primaryDark}
              />
            </View>
          )}
          <Text
            style={[styles.brandName, layout.isTablet && styles.brandNameTablet]}
            numberOfLines={1}
          >
            {companyName}
          </Text>
        </View>
        <View style={styles.clockCol}>
          <Text style={styles.clockTime}>{formatTime(now)}</Text>
          <Text style={styles.clockDate}>{formatDateShort(now)}</Text>
        </View>
      </View>

      <View
        style={[
          styles.center,
          landscape && styles.centerLandscape,
          { paddingHorizontal: layout.paddingH },
        ]}
      >
        <View style={styles.heroCol}>
          <Animated.View
            style={[
              styles.blob,
              {
                width: blobSize,
                height: blobSize,
                borderRadius: blobSize / 2,
              },
              blobStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.fpWrap,
              {
                width: fpSize,
                height: fpSize,
                borderRadius: fpSize / 2,
              },
              fpStyle,
            ]}
          >
            <Ionicons
              name="finger-print-outline"
              size={fpIcon}
              color={T.primary}
            />
          </Animated.View>

          <Text style={[styles.greeting, compact && styles.greetingCompact]}>
            {greeting}
          </Text>
          <Text style={styles.subtitle}>Tap below to clock in or out</Text>
        </View>

        <AnimatedPressable
          onPress={() => navigation.navigate("Pin")}
          onPressIn={() => {
            btnScale.value = withSpring(0.97, T.spring);
            onPressHaptic("medium");
          }}
          onPressOut={() => {
            btnScale.value = withSpring(1, T.spring);
          }}
          style={[
            styles.cta,
            {
              maxWidth: layout.contentMaxWidth,
              width: landscape
                ? Math.min(320, layout.contentMaxWidth)
                : "100%",
              marginTop: landscape ? 0 : compact ? 24 : 48,
            },
            btnStyle,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Enter PIN"
        >
          <Feather name="lock" size={20} color={T.primaryDark} />
          <Text style={styles.ctaText}>Enter PIN</Text>
        </AnimatedPressable>
      </View>

      <Text
        style={[
          styles.footer,
          { paddingBottom: Math.max(layout.paddingBottom, 24) },
        ]}
      >
        Powered by Elitebase
      </Text>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  logoBox: {
    width: 72,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexShrink: 0,
  },
  logoBoxTablet: {
    width: 96,
    height: 64,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logoBoxCompact: {
    width: 56,
    height: 40,
    borderRadius: 10,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  logoFallback: {
    width: 72,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  brandName: { ...T.h2, fontSize: 16, flexShrink: 1 },
  brandNameTablet: { fontSize: 20 },
  clockCol: { alignItems: "flex-end", flexShrink: 0 },
  clockTime: { ...T.h2, fontSize: 22, color: T.text },
  clockDate: { ...T.body, fontSize: 12, marginTop: 2 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
  },
  centerLandscape: {
    flexDirection: "row",
    gap: 32,
    paddingHorizontal: 24,
  },
  heroCol: {
    alignItems: "center",
    justifyContent: "center",
    maxWidth: 480,
    width: "100%",
    flexShrink: 1,
  },
  blob: {
    position: "absolute",
    backgroundColor: T.primaryGlow,
    opacity: 0.4,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
  },
  fpWrap: {
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
  greetingCompact: { fontSize: 28, marginTop: 16 },
  subtitle: {
    ...T.body,
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
    color: T.textMuted,
  },
  cta: {
    minHeight: 64,
    borderRadius: T.radius.pill,
    backgroundColor: T.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    alignSelf: "center",
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaText: { ...T.btn, fontSize: 18, color: "#ffffff" },
  footer: {
    ...T.body,
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    textAlign: "center",
  },
});

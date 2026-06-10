import { useCallback, useEffect } from "react";
import {
  BackHandler,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { T } from "@/constants/tokens";
import { formatClockTime } from "@/lib/format";
import { hapticSuccess } from "@/lib/kioskUi";
import { playSuccess } from "@/lib/sounds";
import type { AttendanceActionType, RootStackParamList } from "@/types";

type SuccessRoute = RouteProp<RootStackParamList, "Success">;
type SuccessNavigation = NativeStackNavigationProp<
  RootStackParamList,
  "Success"
>;

const DISMISS_MS = 3500;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

function gradientForAction(type: AttendanceActionType): readonly [string, string] {
  switch (type) {
    case "clock_in":
      return ["#052e16", "#020203"];
    case "clock_out":
      return ["#1c1917", "#020203"];
    case "break_start":
    case "break_end":
      return ["#1c1400", "#020203"];
    default:
      return ["#052e16", "#020203"];
  }
}

function accentForAction(type: AttendanceActionType) {
  switch (type) {
    case "clock_in":
      return T.success;
    case "clock_out":
      return "#a8a29e";
    case "break_start":
    case "break_end":
      return T.warning;
    default:
      return T.success;
  }
}

function titleForAction(type: AttendanceActionType): string {
  switch (type) {
    case "clock_in":
      return "Clocked In!";
    case "clock_out":
      return "Clocked Out!";
    case "break_start":
      return "Break Started!";
    case "break_end":
      return "Break Ended!";
    default:
      return "Done!";
  }
}

const PARTICLE_ANGLES = [0, 60, 120, 180, 240, 300];

function Particle({ angle, accent }: { angle: number; accent: string }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    progress.value = withDelay(
      200,
      withSequence(
        withTiming(60, { duration: 400, easing: T.easing }),
        withTiming(80, { duration: 200, easing: T.easing })
      )
    );
    opacity.value = withDelay(
      200,
      withTiming(0, { duration: 600, easing: T.easing })
    );
  }, [opacity, progress]);

  const style = useAnimatedStyle(() => {
    const rad = (angle * Math.PI) / 180;
    const dist = progress.value;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: Math.cos(rad) * dist },
        { translateY: Math.sin(rad) * dist },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: accent },
        style,
      ]}
    />
  );
}

export function SuccessScreen() {
  const route = useRoute<SuccessRoute>();
  const navigation = useNavigation<SuccessNavigation>();
  const { employee, actionType, timestamp } = route.params;

  const eventDate = new Date(timestamp);
  const gradient = gradientForAction(actionType);
  const accent = accentForAction(actionType);
  const title = titleForAction(actionType);

  const checkScale = useSharedValue(0);
  const ringScale = useSharedValue(1);
  const titleY = useSharedValue(20);
  const titleOpacity = useSharedValue(0);
  const timeScale = useSharedValue(0.7);
  const progressWidth = useSharedValue(0);

  const goIdle = useCallback(() => {
    navigation.replace("Idle");
  }, [navigation]);

  useEffect(() => {
    void playSuccess();
    void hapticSuccess();

    checkScale.value = withDelay(
      100,
      withSequence(
        withSpring(1.3, { damping: 12, stiffness: 100 }),
        withSpring(1, T.spring)
      )
    );

    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 600, easing: T.easing }),
        withTiming(1, { duration: 600, easing: T.easing })
      ),
      3,
      false
    );

    titleY.value = withDelay(
      200,
      withTiming(0, { duration: 500, easing: T.easing })
    );
    titleOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 500, easing: T.easing })
    );

    timeScale.value = withDelay(300, withSpring(1, T.spring));

    progressWidth.value = withTiming(SCREEN_WIDTH, {
      duration: DISMISS_MS,
      easing: Easing.linear,
    });

    const timer = setTimeout(goIdle, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [
    checkScale,
    goIdle,
    progressWidth,
    ringScale,
    timeScale,
    titleOpacity,
    titleY,
  ]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        goIdle();
        return true;
      });
      return () => sub.remove();
    }, [goIdle])
  );

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleY.value }],
    opacity: titleOpacity.value,
  }));

  const timeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timeScale.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: progressWidth.value,
  }));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradient]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <View style={styles.checkWrap}>
          <Animated.View
            style={[
              styles.ring,
              { borderColor: `${accent}55` },
              ringStyle,
            ]}
          />
          {PARTICLE_ANGLES.map((angle) => (
            <Particle key={angle} angle={angle} accent={accent} />
          ))}
          <Animated.View
            style={[
              styles.checkCircle,
              { backgroundColor: `${accent}22`, borderColor: accent },
              checkStyle,
            ]}
          >
            <Feather name="check" size={56} color={accent} />
          </Animated.View>
        </View>

        <Animated.View style={titleStyle}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.employeeName}>{employee.full_name}</Text>
        </Animated.View>

        <Animated.Text
          style={[styles.bigTime, { color: accent }, timeStyle]}
        >
          {formatClockTime(eventDate)}
        </Animated.Text>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, { backgroundColor: accent }, progressStyle]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  checkWrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  ring: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    ...T.hero,
    textAlign: "center",
    marginTop: 32,
  },
  employeeName: {
    ...T.h2,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 8,
  },
  bigTime: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 48,
    marginTop: 6,
    textAlign: "center",
  },
  progressTrack: {
    height: 3,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  progressFill: { height: 3 },
});

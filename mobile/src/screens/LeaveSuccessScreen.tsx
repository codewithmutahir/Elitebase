import { useCallback, useEffect } from "react";
import { BackHandler, StyleSheet, Text, View } from "react-native";
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
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { T } from "@/constants/tokens";
import { hapticSuccess } from "@/lib/kioskUi";
import type { RootStackParamList } from "@/types";

type Route = RouteProp<RootStackParamList, "LeaveSuccess">;
type Nav = NativeStackNavigationProp<RootStackParamList, "LeaveSuccess">;

const DISMISS_MS = 3500;

export function LeaveSuccessScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { employee, leaveType } = route.params;

  const label = leaveType === "paid_leave" ? "Paid Leave" : "Unpaid Leave";

  const checkScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  const goIdle = useCallback(() => {
    navigation.replace("Idle");
  }, [navigation]);

  useEffect(() => {
    void hapticSuccess();

    checkScale.value = withDelay(
      100,
      withSequence(
        withSpring(1.3, { damping: 12, stiffness: 100 }),
        withSpring(1, T.spring)
      )
    );

    titleOpacity.value = withDelay(
      200,
      withTiming(1, { duration: 400, easing: T.easing })
    );

    progressWidth.value = withTiming(1, {
      duration: DISMISS_MS,
      easing: Easing.linear,
    });

    const timer = setTimeout(goIdle, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [checkScale, goIdle, progressWidth, titleOpacity]);

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

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as `${number}%`,
  }));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0c2d3e", "#020203"] as const}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, checkStyle]}>
          <Feather name="check" size={48} color={T.primary} />
        </Animated.View>

        <Animated.View style={titleStyle}>
          <Text style={styles.title}>Request Submitted</Text>
          <Text style={styles.subtitle}>
            {label} request for {employee.full_name}
          </Text>
          <Text style={styles.pending}>Pending approval</Text>
        </Animated.View>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, progressStyle]}
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
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: T.primary,
    backgroundColor: "rgba(37,99,235,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...T.hero,
    fontSize: 28,
    textAlign: "center",
    marginTop: 28,
  },
  subtitle: {
    ...T.body,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 8,
    fontSize: 16,
  },
  pending: {
    ...T.label,
    color: T.warning,
    textAlign: "center",
    marginTop: 16,
    fontSize: 13,
  },
  progressTrack: {
    height: 3,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  progressFill: {
    height: 3,
    backgroundColor: T.primary,
  },
});

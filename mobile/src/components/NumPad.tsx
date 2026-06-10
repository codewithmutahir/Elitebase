import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { T } from "@/constants/tokens";
import { onPressHaptic } from "@/lib/kioskUi";

type NumPadProps = {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onFingerprint?: () => void;
  disabled?: boolean;
};

type RowKey = string | "fp" | "backspace";

const ROWS: RowKey[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["fp", "0", "backspace"],
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function NumKey({
  label,
  onPress,
  disabled,
  variant,
}: {
  label: string;
  onPress?: () => void;
  disabled: boolean;
  variant: "digit" | "ghost";
}) {
  const scale = useSharedValue(1);
  const bg = useSharedValue<string>(T.surfaceHi);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: bg.value,
  }));

  return (
    <AnimatedPressable
      onPress={() => onPress?.()}
      disabled={disabled || !onPress}
      onPressIn={() => {
        onPressHaptic("light");
        scale.value = withSpring(0.93, T.spring);
        if (variant === "digit") {
          bg.value = withTiming(T.primaryGlow, { duration: 80 });
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, T.spring);
        if (variant === "digit") {
          setTimeout(() => {
            bg.value = withTiming(T.surfaceHi, { duration: 100 });
          }, 100);
        }
      }}
      style={[
        styles.key,
        variant === "ghost" && styles.keyGhost,
        disabled && styles.keyDisabled,
        animStyle,
      ]}
    >
      {variant === "ghost" ? (
        <Ionicons name="backspace-outline" size={28} color={T.textMuted} />
      ) : (
        <Text style={styles.digit}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}

export function NumPad({
  onDigit,
  onBackspace,
  onFingerprint,
  disabled = false,
}: NumPadProps) {
  return (
    <View style={styles.grid}>
      {ROWS.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.keyRow}>
          {row.map((key) => {
            if (key === "fp") {
              return (
                <Pressable
                  key="fp"
                  disabled={disabled}
                  onPress={onFingerprint}
                  onPressIn={() => onPressHaptic("light")}
                  style={({ pressed }) => [
                    styles.key,
                    styles.keyGhost,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    name="finger-print"
                    size={32}
                    color={T.textMuted}
                  />
                </Pressable>
              );
            }
            if (key === "backspace") {
              return (
                <NumKey
                  key="backspace"
                  label=""
                  variant="ghost"
                  disabled={disabled}
                  onPress={onBackspace}
                />
              );
            }
            return (
              <NumKey
                key={key}
                label={key}
                variant="digit"
                disabled={disabled}
                onPress={() => onDigit(key)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  keyRow: { flexDirection: "row", gap: 12 },
  key: {
    flex: 1,
    minHeight: 78,
    borderRadius: T.radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  keyGhost: { backgroundColor: "transparent", borderWidth: 0 },
  keyDisabled: { opacity: 0.45 },
  digit: { ...T.numpad },
  pressed: { opacity: 0.7 },
});

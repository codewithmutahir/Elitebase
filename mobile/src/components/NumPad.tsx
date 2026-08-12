import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { T } from "@/constants/tokens";
import { useKioskLayout } from "@/hooks/useKioskLayout";
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
  size,
  iconSize,
}: {
  label: string;
  onPress?: () => void;
  disabled: boolean;
  variant: "digit" | "ghost";
  size: number;
  iconSize: number;
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
        {
          width: size,
          height: size,
          borderRadius: Math.min(T.radius.xl, size * 0.22),
        },
        styles.key,
        variant === "ghost" && styles.keyGhost,
        disabled && styles.keyDisabled,
        animStyle,
      ]}
    >
      {variant === "ghost" ? (
        <Ionicons name="backspace-outline" size={iconSize} color={T.textMuted} />
      ) : (
        <Text style={[styles.digit, { fontSize: Math.round(size * 0.34) }]}>
          {label}
        </Text>
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
  const { keySize, keyGap, keypadWidth } = useKioskLayout();
  const iconSize = Math.round(keySize * 0.36);

  return (
    <View style={[styles.grid, { width: keypadWidth, gap: keyGap }]}>
      {ROWS.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={[styles.keyRow, { gap: keyGap }]}>
          {row.map((key) => {
            if (key === "fp") {
              return (
                <Pressable
                  key="fp"
                  disabled={disabled || !onFingerprint}
                  onPress={onFingerprint}
                  onPressIn={() => onPressHaptic("light")}
                  style={({ pressed }) => [
                    {
                      width: keySize,
                      height: keySize,
                      borderRadius: Math.min(T.radius.xl, keySize * 0.22),
                    },
                    styles.key,
                    styles.keyGhost,
                    pressed && styles.pressed,
                    !onFingerprint && styles.keyDisabled,
                  ]}
                >
                  <Ionicons
                    name="finger-print"
                    size={iconSize + 4}
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
                  size={keySize}
                  iconSize={iconSize}
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
                size={keySize}
                iconSize={iconSize}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { alignSelf: "center" },
  keyRow: { flexDirection: "row" },
  key: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  keyGhost: { backgroundColor: "transparent", borderWidth: 0 },
  keyDisabled: { opacity: 0.45 },
  digit: { ...T.numpad },
  pressed: { opacity: 0.7 },
});

import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScreenBackground } from "@/components/ScreenBackground";
import { T } from "@/constants/tokens";
import { useKioskLayout } from "@/hooks/useKioskLayout";
import { hapticMedium, onPressHaptic } from "@/lib/kioskUi";
import {
  getRegisterTabletErrorMessage,
  registerTablet,
  toTabletConfig,
} from "@/lib/kiosk";
import { saveTabletConfig } from "@/lib/storage";
import type { RootStackParamList } from "@/types";

type SetupNavigation = NativeStackNavigationProp<RootStackParamList, "Setup">;

export function SetupScreen() {
  const navigation = useNavigation<SetupNavigation>();
  const [setupCode, setSetupCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedCode = setupCode.trim();
  const canSubmit = trimmedCode.length > 0 && !loading;
  const layout = useKioskLayout();

  async function handleConnect() {
    if (!canSubmit) return;
    void hapticMedium();
    setLoading(true);
    setError(null);

    try {
      const response = await registerTablet(trimmedCode);
      await saveTabletConfig(toTabletConfig(response));
      navigation.replace("Idle");
    } catch (err) {
      setError(getRegisterTabletErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenBackground>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingHorizontal: layout.paddingH,
              paddingTop: layout.paddingTop + 24,
              paddingBottom: layout.paddingBottom + 24,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={[styles.inner, { maxWidth: layout.contentMaxWidth }]}>
          <View style={styles.brandZone}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoLetter}>E</Text>
            </View>
            <Text style={styles.brandName}>Elitebase</Text>
            <Text style={styles.tagline}>Kiosk Time Clock</Text>
            <Text style={styles.hint}>Set up this tablet once to get started</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.title}>Connect this tablet</Text>
            <Text style={styles.subtitle}>
              Enter the setup code from your Elitebase admin dashboard
            </Text>

            <TextInput
              value={setupCode}
              onChangeText={(text) => {
                setSetupCode(text.toUpperCase());
                if (error) setError(null);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="ALPHA-0000"
              placeholderTextColor={T.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!loading}
              style={[styles.input, focused && styles.inputFocused]}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={() => void handleConnect()}
              disabled={!canSubmit}
              onPressIn={() => onPressHaptic("medium")}
              style={({ pressed }) => [
                styles.button,
                !canSubmit && styles.buttonDisabled,
                pressed && canSubmit && styles.buttonPressed,
              ]}
            >
              {loading ? (
                <View style={styles.buttonLoading}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.buttonText}>Connecting...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Connect Tablet</Text>
              )}
            </Pressable>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    gap: 32,
  },
  inner: {
    width: "100%",
    gap: 32,
  },
  brandZone: {
    alignItems: "center",
    padding: 28,
    backgroundColor: T.primary,
    borderRadius: T.radius.lg,
    gap: 12,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoLetter: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 32,
    color: "#fff",
  },
  brandName: {
    fontFamily: "PlusJakartaSans_800ExtraBold",
    fontSize: 28,
    color: "#fff",
  },
  tagline: { ...T.body, fontSize: 16, color: "rgba(255,255,255,0.85)" },
  hint: {
    ...T.body,
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  formSection: { gap: 16 },
  title: { ...T.title, fontSize: 24 },
  subtitle: { ...T.body },
  input: {
    borderWidth: 2,
    borderColor: T.border,
    borderRadius: T.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 22,
    color: T.text,
    textAlign: "center",
    letterSpacing: 4,
    backgroundColor: T.surfaceHi,
    minHeight: 56,
  },
  inputFocused: { borderColor: T.primary },
  error: { ...T.body, color: T.error, textAlign: "center" },
  button: {
    backgroundColor: T.primary,
    borderRadius: T.radius.pill,
    paddingVertical: 16,
    alignItems: "center",
    minHeight: 56,
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.9 },
  buttonLoading: { flexDirection: "row", alignItems: "center", gap: 10 },
  buttonText: { ...T.btn, fontSize: 18, color: "#fff" },
});

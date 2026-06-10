import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather, Ionicons } from "@expo/vector-icons";
import { ScreenBackground } from "@/components/ScreenBackground";
import { T } from "@/constants/tokens";
import { avatarColor, employeeInitials } from "@/lib/format";
import { getTabletConfig } from "@/lib/storage";
import { hapticMedium, onPressHaptic } from "@/lib/kioskUi";
import type { RootStackParamList } from "@/types";

type ConsentRoute = RouteProp<RootStackParamList, "Consent">;
type ConsentNavigation = NativeStackNavigationProp<
  RootStackParamList,
  "Consent"
>;

const BULLETS = [
  "Used only for attendance verification at this kiosk",
  "Encrypted and stored securely on our servers",
  "Never sold or shared with third parties",
  "You can withdraw consent by contacting your manager",
] as const;

export function ConsentScreen() {
  const route = useRoute<ConsentRoute>();
  const navigation = useNavigation<ConsentNavigation>();
  const { employee } = route.params;

  const [companyName, setCompanyName] = useState("Your employer");
  const initials = employeeInitials(employee.full_name);
  const avatarBg = avatarColor(employee.full_name);

  useEffect(() => {
    void getTabletConfig().then((config) => {
      if (config?.company_name) setCompanyName(config.company_name);
    });
  }, []);

  return (
    <ScreenBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{employee.full_name}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FIRST TIME SETUP</Text>
          </View>
        </View>

        <View style={styles.shieldSection}>
          <View style={styles.shieldCircle}>
            <Ionicons name="shield-checkmark" size={32} color={T.success} />
          </View>
          <Text style={styles.shieldCaption}>Your data is protected</Text>
        </View>

        <View style={styles.consentBox}>
          <Text style={styles.intro}>
            {companyName} collects facial geometry data for attendance only.
          </Text>
          {BULLETS.map((line) => (
            <View key={line} style={styles.bulletRow}>
              <Feather
                name="check-circle"
                size={14}
                color={T.success}
                style={styles.bulletIcon}
              />
              <Text style={styles.bulletText}>{line}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              onPressHaptic("light");
              navigation.replace("Idle");
            }}
            onPressIn={() => onPressHaptic("light")}
            style={({ pressed }) => [
              styles.declineBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.declineText}>Decline</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void hapticMedium();
              navigation.replace("FaceRegister", { employee });
            }}
            onPressIn={() => onPressHaptic("medium")}
            style={({ pressed }) => [
              styles.agreeBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.agreeText}>I Agree & Continue</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 48,
  },
  top: { alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: { ...T.h2, fontSize: 26, color: T.text },
  name: { ...T.title, textAlign: "center" },
  badge: {
    marginTop: 8,
    backgroundColor: T.primaryGlow,
    borderRadius: T.radius.pill,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: T.primaryBorder,
  },
  badgeText: { ...T.label, color: T.primary },
  shieldSection: { marginTop: 32, alignItems: "center" },
  shieldCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  shieldCaption: { ...T.body, marginTop: 12, textAlign: "center" },
  consentBox: {
    marginTop: 24,
    backgroundColor: T.surface,
    borderRadius: T.radius.lg,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: T.border,
    gap: 12,
  },
  intro: { ...T.body, marginBottom: 4 },
  bulletRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  bulletIcon: { marginTop: 3 },
  bulletText: { ...T.body, flex: 1 },
  actions: { marginTop: 32, gap: 12 },
  declineBtn: {
    minHeight: 56,
    borderRadius: T.radius.pill,
    backgroundColor: T.surfaceHi,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: { ...T.btn, color: T.textMuted },
  agreeBtn: {
    minHeight: 56,
    borderRadius: T.radius.pill,
    backgroundColor: T.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  agreeText: { ...T.btn, fontSize: 16, color: "#ffffff" },
  pressed: { opacity: 0.88 },
});

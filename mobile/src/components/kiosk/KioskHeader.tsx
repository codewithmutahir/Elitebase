import { Image, StyleSheet, Text, View } from "react-native";
import { LiveClock } from "@/components/kiosk/LiveClock";

type KioskHeaderProps = {
  companyName: string;
  logoUrl?: string | null;
  initials: string;
};

export function KioskHeader({ companyName, logoUrl, initials }: KioskHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={styles.logo}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoText}>{initials}</Text>
          </View>
        )}
        <Text style={styles.companyName} numberOfLines={1}>
          {companyName}
        </Text>
      </View>
      <LiveClock compact />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 16,
  },
  logo: {
    width: 40,
    height: 40,
  },
  logoFallback: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#475569",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  companyName: {
    marginLeft: 12,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#0F172A",
    flexShrink: 1,
  },
});

import "react-native-gesture-handler";
import "react-native-reanimated";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import {
  createNavigationContainerRef,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { T } from "@/constants/tokens";
import { useKioskImmersiveMode } from "@/hooks/useKioskImmersiveMode";
import { loadSounds, unloadSounds } from "@/lib/sounds";
import { getTabletToken } from "@/lib/storage";
import { warmupFaceService } from "@/lib/faceWarmup";
import {
  subscribeTabletSessionInvalidated,
  validateTabletSession,
} from "@/lib/tabletSession";
import { ActionScreen } from "@/screens/ActionScreen";
import { ConsentScreen } from "@/screens/ConsentScreen";
import { FaceRegisterScreen } from "@/screens/FaceRegisterScreen";
import { FaceScanScreen } from "@/screens/FaceScanScreen";
import { IdleScreen } from "@/screens/IdleScreen";
import { PinScreen } from "@/screens/PinScreen";
import { SetupScreen } from "@/screens/SetupScreen";
import { SuccessScreen } from "@/screens/SuccessScreen";
import type { RootStackParamList } from "@/types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

SplashScreen.preventAutoHideAsync();

function KioskAppTree() {
  useKioskImmersiveMode();

  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const [authReady, setAuthReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<"Setup" | "Idle">("Setup");

  useEffect(() => {
    void loadSounds();
    return () => {
      void unloadSounds();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function resolveTabletSession() {
      const token = await getTabletToken();
      if (!token) {
        if (mounted) {
          setInitialRoute("Setup");
          setAuthReady(true);
        }
        return;
      }

      try {
        const valid = await validateTabletSession();
        if (mounted) {
          setInitialRoute(valid ? "Idle" : "Setup");
          setAuthReady(true);
        }
        if (valid) {
          void warmupFaceService();
        }
      } catch {
        if (mounted) {
          setInitialRoute("Idle");
          setAuthReady(true);
        }
        void warmupFaceService();
      }
    }

    void resolveTabletSession();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return subscribeTabletSessionInvalidated(() => {
      if (navigationRef.isReady()) {
        navigationRef.reset({
          index: 0,
          routes: [{ name: "Setup" }],
        });
      }
    });
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && authReady) {
      await SplashScreen.hideAsync();
    }
  }, [authReady, fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (!authReady) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={T.primary} />
      </View>
    );
  }

  return (
    <View style={styles.app} onLayout={onLayoutRootView}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            animation: "fade",
            contentStyle: { backgroundColor: T.bgBase },
          }}
        >
          <Stack.Screen name="Setup" component={SetupScreen} />
          <Stack.Screen name="Idle" component={IdleScreen} />
          <Stack.Screen name="Pin" component={PinScreen} />
          <Stack.Screen name="Consent" component={ConsentScreen} />
          <Stack.Screen name="FaceRegister" component={FaceRegisterScreen} />
          <Stack.Screen name="FaceScan" component={FaceScanScreen} />
          <Stack.Screen name="Action" component={ActionScreen} />
          <Stack.Screen name="Success" component={SuccessScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <KioskAppTree />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: T.bgBase,
  },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.bgBase,
  },
});

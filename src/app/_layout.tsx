import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
void SplashScreen.preventAutoHideAsync().catch(() => {});
function Navegacao() {
  const { estado } = useAuth();
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={estado === "autenticado"}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={estado !== "autenticado"}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
          <Navegacao />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

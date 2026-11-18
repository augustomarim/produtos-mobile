import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCoresProdutos } from "@/hooks/use-tema-produtos";
import * as SplashScreen from "expo-splash-screen";
import { NotificacoesProvider } from "@/contexts/NotificacoesContext";
import { FeedbackProvider } from "@/contexts/FeedbackContext";
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
        <Stack.Screen name="produtos/novo" />
        <Stack.Screen name="notificacoes" />
        <Stack.Screen name="produtos/[id]/editar" />
      </Stack.Protected>
      <Stack.Protected guard={estado !== "autenticado"}>
        <Stack.Screen name="login" />
        <Stack.Screen name="cadastro" />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  const escuro = useColorScheme() === "dark";
  const base = escuro ? DarkTheme : DefaultTheme;
  const cores = useCoresProdutos();
  const tema = {
    ...base,
    colors: {
      ...base.colors,
      background: cores.fundo,
      card: cores.superficie,
      text: cores.texto,
      border: cores.borda,
      primary: cores.destaque,
    },
  };
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificacoesProvider>
          <FeedbackProvider>
            <ThemeProvider value={tema}>
              <StatusBar style={escuro ? "light" : "dark"} />
              <Navegacao />
            </ThemeProvider>
          </FeedbackProvider>
        </NotificacoesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

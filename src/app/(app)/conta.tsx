import Constants from "expo-constants";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSaidaConta } from "@/hooks/useSaidaConta";
export default function ContaScreen() {
  const { saindo, confirmarSaida } = useSaidaConta(() => {});
  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Sua conta</Text>
        <Text style={s.text}>
          Seus produtos ficam disponíveis no aplicativo e no site, usando a
          mesma conta.
        </Text>
        <Text style={s.subtitle}>Privacidade</Text>
        <Text style={s.text}>
          Somente você pode acessar e gerenciar os produtos desta conta. Ao
          sair, a sessão é removida deste aparelho.
        </Text>
        <Text style={s.subtitle}>Fotos</Text>
        <Text style={s.text}>
          Escolha fotos da sua biblioteca para identificar os produtos. Toque
          nas miniaturas para ampliar.
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={saindo}
          onPress={() => void confirmarSaida()}
          style={[s.button, saindo && s.disabled]}
        >
          <Text style={s.danger}>{saindo ? "Saindo…" : "Sair da conta"}</Text>
        </Pressable>
        <Text style={s.version}>
          Produtos · versão {Constants.expoConfig?.version ?? "1.0.0"}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f9" },
  content: { padding: 24, paddingBottom: 100 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#182b3a",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#182b3a",
    marginTop: 24,
    marginBottom: 10,
  },
  text: { fontSize: 16, lineHeight: 25, color: "#607483" },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#e7b9bf",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginTop: 32,
    backgroundColor: "white",
  },
  danger: { color: "#a52b38", fontWeight: "600", fontSize: 16 },
  disabled: { opacity: 0.5 },
  version: { fontSize: 12, color: "#607483", marginTop: 32 },
});

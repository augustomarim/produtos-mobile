import { Link, useLocalSearchParams } from "expo-router";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
export default function LoginScreen() {
  const { cadastro } = useLocalSearchParams<{ cadastro?: string }>();
  return <FormularioLogin key={cadastro || "login"} contaCriada={!!cadastro} />;
}
function FormularioLogin({ contaCriada }: { contaCriada: boolean }) {
  const { estado, erroInicial, entrar, tentarNovamente } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  async function enviar() {
    if (enviando) return;
    setErro("");
    if (!email.trim() || !senha) {
      setErro("Informe seu email e sua senha.");
      return;
    }
    setEnviando(true);
    try {
      await entrar(email, senha);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível entrar.",
      );
    } finally {
      setEnviando(false);
    }
  }
  if (estado === "carregando")
    return (
      <SafeAreaView style={[s.screen, s.center]}>
        <ActivityIndicator size="large" color="#137c65" />
        <Text style={s.loading}>Verificando sua sessão…</Text>
      </SafeAreaView>
    );
  if (estado === "erro")
    return (
      <SafeAreaView style={[s.screen, s.center]}>
        <Text style={s.title}>Não foi possível continuar</Text>
        <Text accessibilityRole="alert" style={s.description}>
          {erroInicial}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={tentarNovamente}
          style={s.button}
        >
          <Text style={s.buttonText}>Tentar novamente</Text>
        </Pressable>
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.content}
        >
          <Text style={s.eyebrow}>PRODUTOS MOBILE</Text>
          <Text style={s.title}>Entre na sua conta</Text>
          <Text style={s.description}>
            Use o mesmo email e senha do site. Seu catálogo é exclusivo da sua
            conta.
          </Text>
          <View style={s.card}>
            {contaCriada && (
              <Text accessibilityRole="alert" style={s.description}>
                Conta criada com sucesso. Entre com seu email e senha.
              </Text>
            )}
            <Text style={s.label}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              style={s.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              editable={!enviando}
              placeholder="seu@email.com"
              placeholderTextColor="#83939e"
            />
            <Text style={s.label}>Senha</Text>
            <TextInput
              accessibilityLabel="Senha"
              style={s.input}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              editable={!enviando}
              returnKeyType="go"
              onSubmitEditing={() => void enviar()}
              placeholder="Sua senha"
              placeholderTextColor="#83939e"
            />
            {!!erro && (
              <Text accessibilityRole="alert" style={s.error}>
                {erro}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: enviando, busy: enviando }}
              disabled={enviando}
              onPress={() => void enviar()}
              style={({ pressed }) => [
                s.button,
                (pressed || enviando) && s.disabled,
              ]}
            >
              {enviando && (
                <ActivityIndicator color="white" style={s.spinner} />
              )}
              <Text style={s.buttonText}>
                {enviando ? "Entrando…" : "Entrar"}
              </Text>
            </Pressable>
            <Text style={s.hint}>
              Aqui você usa sua conta do catálogo, não sua conta da Expo ou do
              GitHub.
            </Text>
            <Link href="/cadastro" asChild>
              <Pressable
                accessibilityRole="button"
                disabled={enviando}
                style={{ padding: 16, alignItems: "center", minHeight: 48 }}
              >
                <Text style={{ color: "#137c65", fontWeight: "600" }}>
                  Criar conta
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: "#f5f7f9" },
  center: { justifyContent: "center", alignItems: "center", padding: 24 },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  eyebrow: {
    color: "#137c65",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: "#182b3a",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 16,
  },
  description: {
    color: "#607483",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
  },
  card: {
    backgroundColor: "white",
    borderColor: "#e5eaef",
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  label: { color: "#182b3a", fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    backgroundColor: "white",
    borderColor: "#ccd7df",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#182b3a",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#137c65",
    borderRadius: 10,
    minHeight: 48,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  spinner: { marginRight: 10 },
  error: {
    color: "#a52b38",
    backgroundColor: "#fff0f0",
    padding: 12,
    borderRadius: 8,
    lineHeight: 21,
    marginBottom: 20,
  },
  hint: { color: "#607483", fontSize: 12, lineHeight: 18, marginTop: 20 },
  loading: { color: "#607483", fontSize: 16, marginTop: 16 },
});

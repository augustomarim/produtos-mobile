import { useRef, useState, type ComponentRef } from "react";
import {
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
import { Stack, useRouter } from "expo-router";
import { api, ApiError } from "@/lib/api";
import { useProtecaoFormulario } from "@/hooks/useProtecaoFormulario";
import { useAuth } from "@/contexts/AuthContext";
export default function CadastroScreen() {
  const router = useRouter();
  const { estado } = useAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const envio = useRef(false);
  const nomeRef = useRef<ComponentRef<typeof TextInput>>(null);
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const senhaRef = useRef<ComponentRef<typeof TextInput>>(null);
  const confirmarRef = useRef<ComponentRef<typeof TextInput>>(null);
  const liberar = useProtecaoFormulario(
    { alterado: !!(nome || email || senha || confirmacao), ocupado: enviando },
    estado !== "autenticado",
  );
  function voltar() {
    if (envio.current) return;
    if (router.canGoBack()) router.back();
    else router.replace("/login");
  }
  function focar(e: Record<string, string>) {
    requestAnimationFrame(() => {
      if (e.nome) nomeRef.current?.focus();
      else if (e.email) emailRef.current?.focus();
      else if (e.senha) senhaRef.current?.focus();
      else if (e.confirmacao) confirmarRef.current?.focus();
    });
  }
  async function enviar() {
    if (envio.current) return;
    const invalidos: Record<string, string> = {};
    if (!nome.trim()) invalidos.nome = "Informe seu nome.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      invalidos.email = "Informe um email válido.";
    if (senha.length < 6) invalidos.senha = "Use pelo menos 6 caracteres.";
    if (senha !== confirmacao)
      invalidos.confirmacao = "As senhas não são iguais.";
    setErros(invalidos);
    setErro("");
    if (Object.keys(invalidos).length) {
      focar(invalidos);
      return;
    }
    envio.current = true;
    setEnviando(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ nome: nome.trim(), email: email.trim(), senha }),
      });
      liberar();
      router.dismissTo({
        pathname: "/login",
        params: { cadastro: String(Date.now()) },
      });
    } catch (e) {
      if (e instanceof ApiError) {
        const campos: Record<string, string> = {};
        for (const d of e.details)
          if (["nome", "email", "senha"].includes(d.field))
            campos[d.field] = d.message;
        if (e.status === 409)
          campos.email = "Este email já está cadastrado. Entre na sua conta.";
        if (Object.keys(campos).length) {
          setErros(campos);
          focar(campos);
          return;
        }
      }
      setErro(
        e instanceof Error ? e.message : "Não foi possível criar sua conta.",
      );
    } finally {
      envio.current = false;
      setEnviando(false);
    }
  }
  const fields = [
    { key: "nome", label: "Nome", value: nome, set: setNome, ref: nomeRef },
    {
      key: "email",
      label: "Email",
      value: email,
      set: setEmail,
      ref: emailRef,
    },
    {
      key: "senha",
      label: "Senha",
      value: senha,
      set: setSenha,
      ref: senhaRef,
    },
    {
      key: "confirmacao",
      label: "Confirmar senha",
      value: confirmacao,
      set: setConfirmacao,
      ref: confirmarRef,
    },
  ];
  return (
    <SafeAreaView style={s.screen} edges={["left", "right", "bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Criar conta",
          headerBackTitle: "Voltar",
          headerTintColor: "#137c65",
          gestureEnabled: !enviando,
        }}
      />
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.content}
        >
          <Text style={s.title}>Crie sua conta</Text>
          <Text style={s.hint}>
            Você poderá usar esta conta também no site. Seus produtos ficam
            separados dos de outras pessoas.
          </Text>
          {fields.map((field) => (
            <View key={field.key} style={s.field}>
              <Text style={s.label}>{field.label}</Text>
              <TextInput
                ref={field.ref}
                accessibilityLabel={field.label}
                accessibilityHint={erros[field.key]}
                value={field.value}
                onChangeText={(value) => {
                  field.set(value);
                  setErros((old) => ({ ...old, [field.key]: "" }));
                }}
                editable={!enviando}
                autoCapitalize={field.key === "nome" ? "words" : "none"}
                autoCorrect={false}
                keyboardType={
                  field.key === "email" ? "email-address" : "default"
                }
                secureTextEntry={
                  field.key === "senha" || field.key === "confirmacao"
                }
                style={[s.input, !!erros[field.key] && s.invalid]}
              />
              {!!erros[field.key] && (
                <Text accessibilityRole="alert" style={s.error}>
                  {erros[field.key]}
                </Text>
              )}
            </View>
          ))}
          {!!erro && (
            <Text accessibilityRole="alert" style={s.error}>
              {erro}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={enviando}
            style={[s.button, enviando && s.disabled]}
            onPress={() => void enviar()}
          >
            <Text style={s.buttonText}>
              {enviando ? "Criando conta…" : "Criar conta"}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={enviando}
            onPress={voltar}
            style={s.cancel}
          >
            <Text style={s.cancelText}>Já tenho conta</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f9" },
  flex: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  title: {
    color: "#182b3a",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  hint: { color: "#607483", fontSize: 15, lineHeight: 23, marginBottom: 22 },
  field: { marginBottom: 18 },
  label: { color: "#182b3a", fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccd7df",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "white",
    color: "#182b3a",
  },
  invalid: { borderColor: "#b42333" },
  error: {
    color: "#a52b38",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#137c65",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    minHeight: 48,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  cancel: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  cancelText: { color: "#137c65", fontWeight: "600" },
});

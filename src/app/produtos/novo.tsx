import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import {
  useProtecaoFormulario,
  type EstadoFormulario,
} from "@/hooks/useProtecaoFormulario";
import ProdutoForm from "@/components/produtos/ProdutoForm";
import { useAuth } from "@/contexts/AuthContext";
import { criarProduto } from "@/lib/produtos";
import type { DadosProdutoForm } from "@/types/produto";

export default function NovoProdutoScreen() {
  const router = useRouter();
  const { requisicao, estado } = useAuth();
  const [enviando, setEnviando] = useState(false);
  const envioEmAndamento = useRef(false);
  const [formulario, setFormulario] = useState<EstadoFormulario>({
    alterado: false,
    ocupado: false,
  });
  const desativarBloqueio = useProtecaoFormulario(
    { ...formulario, ocupado: formulario.ocupado || enviando },
    estado === "autenticado",
  );

  function voltar() {
    if (envioEmAndamento.current) return;
    if (router.canGoBack()) router.back();
    else router.replace("/(app)");
  }

  async function salvar(dados: DadosProdutoForm) {
    if (envioEmAndamento.current) return;
    envioEmAndamento.current = true;
    setEnviando(true);
    try {
      const produto = await criarProduto(dados, requisicao);
      if (!produto || !Number.isInteger(produto.id) || produto.id <= 0) {
        throw new Error(
          "Não foi possível confirmar a resposta. Confira a lista antes de tentar cadastrar novamente.",
        );
      }
      setEnviando(false);
      desativarBloqueio();
      // Remove o cadastro da pilha. Uma próxima abertura começa com campos vazios.
      router.dismissTo({
        pathname: "/(app)",
        params: { criado: String(produto.id) },
      });
    } finally {
      envioEmAndamento.current = false;
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={["left", "right", "bottom"]}>
      <Stack.Screen
        options={{
          title: "Novo produto",
          headerShown: true,
          gestureEnabled: !enviando,
          headerBackTitle: "Voltar",
          headerTintColor: "#137c65",
          headerStyle: { backgroundColor: "#f5f7f9" },
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
          <Text style={s.title}>Novo produto</Text>
          <Text style={s.description}>
            Preencha os dados e, se quiser, escolha uma foto. O produto será
            criado como ativo na sua conta.
          </Text>
          <ProdutoForm
            onEstadoChange={setFormulario}
            onSalvar={salvar}
            onCancelar={voltar}
            textoBotao="Criar produto"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f9" },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 36 },
  title: {
    color: "#182b3a",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
  },
  description: {
    color: "#607483",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
});

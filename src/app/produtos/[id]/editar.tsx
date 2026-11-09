import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import ProdutoForm from "@/components/produtos/ProdutoForm";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import {
  useProtecaoFormulario,
  type EstadoFormulario,
} from "@/hooks/useProtecaoFormulario";
import { confirmarAcao } from "@/lib/confirmacao";
import {
  buscarProduto,
  editarProduto,
  removerFotoProduto,
} from "@/lib/produtos";
import type { DadosProdutoForm, Produto } from "@/types/produto";

export default function EditarProdutoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <Editor
      key={typeof id === "string" ? id : "invalido"}
      id={typeof id === "string" ? Number(id) : NaN}
    />
  );
}
function Editor({ id }: { id: number }) {
  const router = useRouter();
  const { requisicao, estado } = useAuth();
  const avisar = useFeedback();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const envio = useRef(false);
  const [formulario, setFormulario] = useState<EstadoFormulario>({
    alterado: false,
    ocupado: false,
  });
  const liberar = useProtecaoFormulario(
    { ...formulario, ocupado: formulario.ocupado || enviando },
    estado === "autenticado",
  );
  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();
    void Promise.resolve()
      .then(() => buscarProduto(id, requisicao, controller.signal))
      .then((dados) => {
        if (ativo) {
          if (!dados?.id) throw new Error("Produto não encontrado.");
          setProduto(dados);
        }
      })
      .catch((e: unknown) => {
        if (ativo)
          setErro(
            e instanceof Error
              ? e.message
              : "Não foi possível abrir o produto.",
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
      controller.abort();
    };
  }, [id, requisicao, tentativa]);
  function voltar() {
    if (envio.current) return;
    if (router.canGoBack()) router.back();
    else router.replace("/(app)");
  }
  async function salvar(dados: DadosProdutoForm) {
    if (envio.current) return;
    envio.current = true;
    setEnviando(true);
    try {
      await editarProduto(id, dados, requisicao);
      liberar();
      avisar("Produto atualizado com sucesso.");
      if (router.canGoBack()) router.back();
      else router.replace("/(app)");
    } finally {
      envio.current = false;
      setEnviando(false);
    }
  }
  async function removerFoto() {
    if (
      !(await confirmarAcao(
        "Remover foto atual?",
        "A remoção é imediata e não pode ser desfeita. As outras alterações serão mantidas no formulário.",
        "Remover foto",
        true,
      ))
    )
      return;
    const atual = await removerFotoProduto(id, requisicao);
    setProduto((anterior) =>
      anterior
        ? {
            ...anterior,
            foto_produto: atual.foto_produto,
            foto_miniatura: atual.foto_miniatura,
            updatedAt: atual.updatedAt,
          }
        : anterior,
    );
    avisar(
      "Foto removida. As outras alterações só serão salvas ao confirmar o formulário.",
    );
  }
  return (
    <SafeAreaView style={s.screen} edges={["left", "right", "bottom"]}>
      <Stack.Screen
        options={{
          title: "Editar produto",
          headerShown: true,
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
          <Text style={s.title}>Editar produto</Text>
          {carregando ? (
            <ActivityIndicator
              accessibilityLabel="Carregando produto"
              size="large"
              color="#137c65"
            />
          ) : erro ? (
            <>
              <Text accessibilityRole="alert" style={s.error}>
                {erro}
              </Text>
              <Pressable
                accessibilityRole="button"
                style={s.button}
                onPress={() => {
                  setErro("");
                  setCarregando(true);
                  setTentativa((v) => v + 1);
                }}
              >
                <Text>Tentar novamente</Text>
              </Pressable>
            </>
          ) : (
            produto && (
              <ProdutoForm
                codigoInicial={produto.codigo_produto}
                descricaoInicial={produto.descricao_produto}
                fotoAtual={produto.foto_produto}
                onRemoverFoto={removerFoto}
                onEstadoChange={setFormulario}
                onSalvar={salvar}
                onCancelar={voltar}
                textoBotao="Salvar alterações"
              />
            )
          )}
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
    marginBottom: 22,
  },
  error: { color: "#a52b38", fontSize: 15, marginBottom: 16 },
  button: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    minHeight: 48,
  },
});

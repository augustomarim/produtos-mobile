import { Link, useLocalSearchParams } from "expo-router";
import AvisoProdutoCriado from "@/components/produtos/AvisoProdutoCriado";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EstadoLista from "@/components/produtos/EstadoLista";
import FiltrosProdutos from "@/components/produtos/FiltrosProdutos";
import PaginacaoProdutos from "@/components/produtos/PaginacaoProdutos";
import ProdutoCard from "@/components/produtos/ProdutoCard";
import ResumoProdutos from "@/components/produtos/ResumoProdutos";
import CheckboxProduto from "@/components/produtos/CheckboxProduto";
import AcoesLoteProdutos from "@/components/produtos/AcoesLoteProdutos";
import { useSelecaoProdutos } from "@/hooks/useSelecaoProdutos";
import { useAcoesProdutos } from "@/hooks/useAcoesProdutos";
import { BottomTabInset } from "@/constants/theme";
import { useProdutos } from "@/hooks/useProdutos";
import { useSaidaConta } from "@/hooks/useSaidaConta";
export default function HomeScreen() {
  const { criado } = useLocalSearchParams<{ criado?: string }>();
  const criacao = typeof criado === "string" ? criado : "";
  return (
    <CatalogoScreen key={criacao || "catalogo"} mostrarAviso={!!criacao} />
  );
}

function CatalogoScreen({ mostrarAviso }: { mostrarAviso: boolean }) {
  const catalogo = useProdutos();
  const { saindo, confirmarSaida } = useSaidaConta(catalogo.cancelar);
  const selecao = useSelecaoProdutos(catalogo.produtos);
  const acoes = useAcoesProdutos(
    catalogo.produtos,
    selecao.ids,
    selecao.limpar,
    catalogo.aplicarAlteracao,
  );
  const ocupado = saindo || acoes.ocupado;
  const bloqueado = ocupado || catalogo.carregando;
  return (
    <SafeAreaView style={s.screen} edges={["top", "left", "right"]}>
      <FlatList
        data={catalogo.produtos}
        keyExtractor={(p) => String(p.id)}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <ProdutoCard
            produto={item}
            selecionado={selecao.ids.has(item.id)}
            desabilitado={bloqueado}
            operacao={
              acoes.pendente?.id === item.id ? acoes.pendente.acao : undefined
            }
            onSelecionar={() => selecao.marcar(item.id)}
            onStatus={() => void acoes.individual(item, "status")}
            onExcluir={() => void acoes.individual(item, "excluir")}
          />
        )}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={catalogo.carregando}
        onRefresh={() => {
          if (!ocupado) catalogo.atualizar();
        }}
        ListHeaderComponent={
          <View>
            <View style={s.header}>
              <Text style={s.eyebrow}>PRODUTOS MOBILE</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: ocupado, busy: saindo }}
                disabled={ocupado}
                onPress={confirmarSaida}
                style={[s.button, ocupado && s.disabled]}
              >
                <Text style={s.logout}>{saindo ? "Saindo…" : "Sair"}</Text>
              </Pressable>
            </View>
            <Text style={s.title}>Meus produtos</Text>
            <Text style={s.description}>
              Este catálogo é exclusivo da sua conta.
            </Text>
            {mostrarAviso && <AvisoProdutoCriado />}
            <Link href="/produtos/novo" asChild>
              <Pressable
                accessibilityRole="button"
                disabled={ocupado}
                style={StyleSheet.flatten([s.newButton, ocupado && s.disabled])}
              >
                <Text style={s.newButtonText}>Novo produto</Text>
              </Pressable>
            </Link>
            <ResumoProdutos resumo={catalogo.resultado?.resumo} />
            <FiltrosProdutos
              busca={catalogo.busca}
              filtro={catalogo.filtro}
              desabilitado={ocupado}
              onAlterar={(...args) => {
                selecao.limpar();
                catalogo.alterarFiltros(...args);
              }}
            />
            <View style={s.toolbar}>
              <Text style={s.hint}>
                Ativos primeiro · Alterações mais recentes
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={bloqueado}
                onPress={catalogo.atualizar}
                style={[s.button, bloqueado && s.disabled]}
              >
                <Text style={s.buttonText}>Atualizar</Text>
              </Pressable>
            </View>
            {catalogo.resultado && !catalogo.carregando && (
              <Text style={s.count}>
                {catalogo.resultado.total}{" "}
                {catalogo.resultado.total === 1 ? "produto" : "produtos"}
                {catalogo.filtrando ? " encontrados" : ""} ·{" "}
                {catalogo.produtos.length} nesta página
              </Text>
            )}
            {catalogo.carregando && catalogo.produtos.length > 0 && (
              <View style={s.loading}>
                <ActivityIndicator color="#137c65" />
                <Text style={s.hint}>Atualizando produtos…</Text>
              </View>
            )}
            {catalogo.produtos.length > 0 && (
              <View style={s.toolbar}>
                <CheckboxProduto
                  label="Selecionar todos nesta página"
                  marcado={selecao.todos}
                  parcial={selecao.parcial}
                  desabilitado={bloqueado}
                  onPress={selecao.marcarTodos}
                />
                <Text style={s.hint}>Selecionar esta página</Text>
              </View>
            )}
            {!!catalogo.erro && (
              <View style={s.errorBox}>
                <Text accessibilityRole="alert" style={s.error}>
                  {catalogo.erro}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={bloqueado}
                  onPress={catalogo.atualizar}
                  style={s.retry}
                >
                  <Text style={s.error}>Tentar novamente</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <EstadoLista
            carregando={catalogo.carregando}
            erro={catalogo.erro}
            temProdutos={!!catalogo.resultado?.resumo.total}
          />
        }
        ListFooterComponent={
          catalogo.resultado && catalogo.resultado.total > 0 ? (
            <PaginacaoProdutos
              pagina={catalogo.resultado.pagina}
              paginas={catalogo.resultado.paginas}
              desabilitado={bloqueado}
              onMudar={(pagina) => {
                selecao.limpar();
                catalogo.mudarPagina(pagina);
              }}
            />
          ) : undefined
        }
      />
      <AcoesLoteProdutos
        selecionados={catalogo.produtos.filter((p) => selecao.ids.has(p.id))}
        desabilitado={bloqueado}
        acao={acoes.lote}
        onAcao={(acao) => void acoes.executarLote(acao)}
        onLimpar={selecao.limpar}
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  newButton: {
    backgroundColor: "#137c65",
    padding: 14,
    minHeight: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  newButtonText: { color: "white", fontWeight: "600", fontSize: 16 },
  screen: { flex: 1, backgroundColor: "#f5f7f9" },
  content: { flexGrow: 1, padding: 20, paddingBottom: BottomTabInset + 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  eyebrow: {
    color: "#137c65",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: { color: "#182b3a", fontSize: 30, fontWeight: "700", marginBottom: 8 },
  description: {
    color: "#607483",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  button: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccd7df",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  buttonText: { color: "#425868", fontSize: 14, fontWeight: "600" },
  logout: { color: "#a52b38", fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.45 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  hint: { flex: 1, color: "#607483", fontSize: 12, lineHeight: 18 },
  count: { color: "#607483", fontSize: 12, marginBottom: 16 },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: "#fff0f0",
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  error: { color: "#a52b38", fontSize: 14, lineHeight: 21 },
  retry: { alignSelf: "flex-start", paddingVertical: 10, marginTop: 4 },
});

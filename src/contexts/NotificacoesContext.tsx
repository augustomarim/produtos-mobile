import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useSomNotificacao } from "@/hooks/useSomNotificacao";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable, StyleSheet, Text, View, AppState } from "react-native";
import { conectarTempoReal, type EstadoConexao } from "@/lib/tempo-real";
import {
  tituloAviso,
  eventosParaAlertar,
  detalhesNotificacao,
  dataNotificacao,
} from "@/lib/notificacoes";
import { useAuth } from "./AuthContext";
import { SessaoAlteradaError, SessaoExpiradaError } from "@/lib/auth";
import type { ListaNotificacoes, Notificacao } from "@/lib/notificacoes";
type Contexto = {
  dados: ListaNotificacoes | null;
  erro: string;
  carregando: boolean;
  marcando: boolean;
  mudarPagina: (pagina: number) => void;
  atualizar: () => Promise<void>;
  marcarLidas: (itens: Notificacao[]) => Promise<void>;
  conexao: EstadoConexao;
  versaoCatalogo: number;
  som: boolean;
  alternarSom: () => void;
};
const Context = createContext<Contexto | null>(null);
export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const { estado, requisicao } = useAuth();
  const insets = useSafeAreaInsets();
  const [conexao, setConexao] = useState<EstadoConexao>("conectando");
  const [versaoCatalogo, setVersaoCatalogo] = useState(0);
  const [som, setSom] = useState(true);
  const [avisos, setAvisos] = useState<{ id: number; itens: Notificacao[] }[]>(
    [],
  );
  const tocar = useSomNotificacao(som);
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState<ListaNotificacoes | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [marcando, setMarcando] = useState(false);
  const pedido = useRef<AbortController | null>(null);
  const vivo = useRef(true);
  const marcacao = useRef(false);
  const falhar = useCallback((e: unknown) => {
    if (
      vivo.current &&
      !(e instanceof SessaoAlteradaError) &&
      !(e instanceof SessaoExpiradaError)
    )
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível carregar as notificações.",
      );
  }, []);
  const atualizar = useCallback(async () => {
    if (estado !== "autenticado" || pedido.current) return;
    const controller = new AbortController();
    pedido.current = controller;
    setCarregando(true);
    try {
      const novos = await requisicao<ListaNotificacoes>(
        `/notificacoes?pagina=${pagina}`,
        { signal: controller.signal },
      );
      if (vivo.current && !controller.signal.aborted) {
        setDados(novos);
        setErro("");
      }
    } catch (e) {
      if (!controller.signal.aborted) falhar(e);
    } finally {
      if (pedido.current === controller) {
        pedido.current = null;
        if (vivo.current) setCarregando(false);
      }
    }
  }, [estado, requisicao, falhar, pagina]);
  useEffect(() => {
    vivo.current = true;
    if (estado !== "autenticado") {
      pedido.current?.abort();
      pedido.current = null;
      let ativo = true;
      void Promise.resolve().then(() => {
        if (ativo) {
          setDados(null);
          setErro("");
          setCarregando(false);
          setAvisos([]);
          setPagina(1);
        }
      });
      return () => {
        ativo = false;
      };
    }
    void Promise.resolve().then(atualizar);
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void atualizar();
    });

    return () => {
      pedido.current?.abort();
      pedido.current = null;
      sub.remove();
    };
  }, [estado, atualizar]);
  useEffect(() => {
    if (estado !== "autenticado") return;
    let parar: (() => void) | undefined;
    const abrir = () => {
      parar?.();
      parar = conectarTempoReal({
        ticket: async () => {
          const d = await requisicao<{ ticket: string }>(
            "/notificacoes/conexao",
          );
          return {
            ...d,
            url:
              process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "",
          };
        },
        estado: setConexao,
        conectado: () => {
          setVersaoCatalogo((v) => v + 1);
          pedido.current?.abort();
          pedido.current = null;
          void atualizar();
        },
        receber: (itens) => {
          setVersaoCatalogo((v) => v + 1);
          pedido.current?.abort();
          pedido.current = null;
          void atualizar();
          const externos = eventosParaAlertar(itens, "mobile");
          if (externos.length) {
            setAvisos((a) =>
              [{ id: externos[0].id, itens: externos }, ...a].slice(0, 3),
            );
            tocar();
          }
        },
      });
    };
    if (
      AppState.currentState !== "background" &&
      AppState.currentState !== "inactive"
    )
      abrir();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") abrir();
      else parar?.();
    });
    return () => {
      parar?.();
      sub.remove();
    };
  }, [estado, requisicao, atualizar, tocar]);
  useEffect(() => {
    if (!avisos.length) return;
    const timer = setTimeout(() => setAvisos((a) => a.slice(0, -1)), 10000);
    return () => clearTimeout(timer);
  }, [avisos]);
  useEffect(
    () => () => {
      vivo.current = false;
      pedido.current?.abort();
    },
    [],
  );
  const marcarLidas = useCallback(
    async (itens: Notificacao[]) => {
      if (marcacao.current || !itens.length || estado !== "autenticado") return;
      marcacao.current = true;
      setMarcando(true);
      setErro("");
      try {
        await requisicao("/notificacoes/lidas", {
          method: "PATCH",
          body: JSON.stringify({
            notificacoes: itens.map(({ id, revisao }) => ({ id, revisao })),
          }),
        });
        pedido.current?.abort();
        pedido.current = null;
        await atualizar();
      } catch (e) {
        falhar(e);
      } finally {
        marcacao.current = false;
        if (vivo.current) setMarcando(false);
      }
    },
    [estado, requisicao, atualizar, falhar],
  );
  return (
    <Context.Provider
      value={{
        dados: estado === "autenticado" ? dados : null,
        erro,
        carregando,
        marcando,
        atualizar,
        marcarLidas,
        conexao,
        versaoCatalogo,
        som,
        alternarSom: () => setSom((s) => !s),
        mudarPagina: (p) => {
          if (!carregando && !marcando && p >= 1 && p <= (dados?.paginas || 1))
            setPagina(p);
        },
      }}
    >
      {children}
      {estado === "autenticado" && (
        <View
          pointerEvents="box-none"
          style={[bubble.container, { top: insets.top + 8 }]}
          accessibilityLiveRegion="polite"
        >
          {avisos.map(({ id, itens }) => {
            const n = itens[0];
            return (
              <View testID="notification-bubble" key={id} style={bubble.card}>
                <View style={bubble.heading}>
                  <Text style={bubble.title}>{tituloAviso(itens)}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Fechar notificação"
                    onPress={() =>
                      setAvisos((a) => a.filter((x) => x.id !== id))
                    }
                    style={bubble.close}
                  >
                    <Text style={bubble.x}>×</Text>
                  </Pressable>
                </View>
                <Text numberOfLines={2} style={bubble.name}>
                  {n.descricao}
                  {itens.length > 1 ? ` e mais ${itens.length - 1}` : ""}
                </Text>
                {itens.length === 1 && n.acao === "editado" && (
                  <Text style={bubble.details}>{detalhesNotificacao(n)}</Text>
                )}
                <Text style={bubble.meta}>
                  Pelo site · {dataNotificacao(n.ocorreuEm)}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Context.Provider>
  );
}
export function useNotificacoes() {
  const c = useContext(Context);
  if (!c) throw new Error("NotificacoesProvider ausente");
  return c;
}

const bubble = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 1000,
    gap: 8,
  },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#c4ddd2",
    borderLeftWidth: 4,
    borderLeftColor: "#16855f",
    borderRadius: 16,
    padding: 14,
    boxShadow: "0px 6px 24px rgba(20,46,39,0.2)",
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { flex: 1, fontSize: 15, fontWeight: "700", color: "#182b3a" },
  close: {
    minHeight: 36,
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  x: { fontSize: 24, color: "#607483" },
  name: { fontSize: 15, fontWeight: "600", color: "#283e36", marginBottom: 6 },
  details: { fontSize: 13, color: "#425868", marginBottom: 6 },
  meta: { fontSize: 12, color: "#607483" },
});

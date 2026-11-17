import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
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
};
const Context = createContext<Contexto | null>(null);
export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const { estado, requisicao } = useAuth();
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
          setPagina(1);
        }
      });
      return () => {
        ativo = false;
      };
    }
    void Promise.resolve().then(atualizar);
    const voltar = () => {
      if (AppState.currentState === "active") void atualizar();
    };
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") void atualizar();
    });
    const timer = setInterval(voltar, 30000);
    return () => {
      pedido.current?.abort();
      pedido.current = null;
      sub.remove();
      clearInterval(timer);
    };
  }, [estado, atualizar]);
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
        mudarPagina: (p) => {
          if (!carregando && !marcando && p >= 1 && p <= (dados?.paginas || 1))
            setPagina(p);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useNotificacoes() {
  const c = useContext(Context);
  if (!c) throw new Error("NotificacoesProvider ausente");
  return c;
}

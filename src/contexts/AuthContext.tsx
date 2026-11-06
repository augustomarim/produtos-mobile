import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as auth from "@/lib/auth";
type EstadoAuth = "carregando" | "autenticado" | "desconectado" | "erro";
type AuthContextData = {
  estado: EstadoAuth;
  erroInicial: string;
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<boolean>;
  tentarNovamente: () => void;
  requisicao: <T>(caminho: string, opcoes?: RequestInit) => Promise<T>;
};
const AuthContext = createContext<AuthContextData | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoAuth>("carregando");
  const [erroInicial, setErroInicial] = useState("");
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    void auth
      .restaurarSessao()
      .then((conectado) => {
        if (ativo) setEstado(conectado ? "autenticado" : "desconectado");
      })
      .catch((error: unknown) => {
        if (ativo) {
          setErroInicial(
            error instanceof Error
              ? error.message
              : "Não foi possível restaurar sua sessão.",
          );
          setEstado("erro");
        }
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);
  const entrar = useCallback(async (email: string, senha: string) => {
    await auth.entrar(email, senha);
    setErroInicial("");
    setEstado("autenticado");
  }, []);
  const sair = useCallback(async () => {
    const confirmado = await auth.sair();
    setErroInicial("");
    setEstado("desconectado");
    return confirmado;
  }, []);
  const tentarNovamente = useCallback(() => {
    setErroInicial("");
    setEstado("carregando");
    setTentativa((v) => v + 1);
  }, []);
  const requisicao = useCallback(
    async <T,>(caminho: string, opcoes: RequestInit = {}): Promise<T> => {
      try {
        return await auth.apiAutenticada<T>(caminho, opcoes);
      } catch (error) {
        if (error instanceof auth.SessaoExpiradaError)
          setEstado("desconectado");
        throw error;
      }
    },
    [],
  );
  return (
    <AuthContext.Provider
      value={{ estado, erroInicial, entrar, sair, tentarNovamente, requisicao }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto)
    throw new Error("useAuth deve ser usado dentro do AuthProvider.");
  return contexto;
}

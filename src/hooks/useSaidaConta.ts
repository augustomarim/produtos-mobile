import { useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { confirmarAcao } from "@/lib/confirmacao";
import { useAuth } from "@/contexts/AuthContext";
function avisar(titulo: string, mensagem: string) {
  if (Platform.OS === "web") window.alert(`${titulo}\n\n${mensagem}`);
  else Alert.alert(titulo, mensagem);
}
export function useSaidaConta(antesDeSair: () => void) {
  const { sair } = useAuth();
  const [saindo, setSaindo] = useState(false);
  const emAndamento = useRef(false);
  async function encerrar() {
    if (emAndamento.current) return;
    emAndamento.current = true;
    setSaindo(true);
    antesDeSair();
    try {
      if (!(await sair()))
        avisar(
          "Conta desconectada",
          "A sessão foi removida deste iPhone, mas não foi possível confirmar o encerramento no servidor.",
        );
    } catch (error) {
      avisar(
        "Não foi possível sair",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      emAndamento.current = false;
      setSaindo(false);
    }
  }
  async function confirmarSaida() {
    if (emAndamento.current) return;
    if (
      await confirmarAcao(
        "Sair da conta?",
        "Você precisará entrar novamente para acessar seus produtos.",
        "Sair",
        true,
      )
    )
      await encerrar();
  }
  return { saindo, confirmarSaida };
}

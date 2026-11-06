import { useRef, useState } from "react";
import { Alert } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
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
        Alert.alert(
          "Conta desconectada",
          "A sessão foi removida deste iPhone, mas não foi possível confirmar o encerramento no servidor.",
        );
    } catch (error) {
      Alert.alert(
        "Não foi possível sair",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    } finally {
      emAndamento.current = false;
      setSaindo(false);
    }
  }
  function confirmarSaida() {
    if (emAndamento.current) return;
    Alert.alert(
      "Sair da conta?",
      "Você precisará entrar novamente para acessar seus produtos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sair",
          style: "destructive",
          onPress: () => {
            void encerrar();
          },
        },
      ],
    );
  }
  return { saindo, confirmarSaida };
}

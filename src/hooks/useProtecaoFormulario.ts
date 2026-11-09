import { useCallback, useState } from "react";
import { Alert, Platform } from "react-native";
import { usePreventRemove } from "expo-router";
import { confirmarAcao } from "@/lib/confirmacao";
export type EstadoFormulario = { alterado: boolean; ocupado: boolean };
export function useProtecaoFormulario(
  { alterado, ocupado }: EstadoFormulario,
  habilitado = true,
) {
  const [liberado, setLiberado] = useState(false);
  const desativar = usePreventRemove(
    !liberado && habilitado && (alterado || ocupado),
    ({ repeat }) => {
      if (ocupado) {
        if (Platform.OS === "web")
          window.alert("Aguarde a conclusão da operação antes de sair.");
        else
          Alert.alert(
            "Aguarde",
            "Aguarde a conclusão da operação antes de sair.",
          );
        return;
      }
      void confirmarAcao(
        "Descartar alterações?",
        "Você tem alterações que ainda não foram salvas. Ao sair, elas serão perdidas.",
        "Descartar e sair",
        true,
      ).then((sair) => {
        if (sair) {
          setLiberado(true);
          repeat();
        }
      });
    },
  );
  return useCallback(() => {
    setLiberado(true);
    desativar();
  }, [desativar]);
}

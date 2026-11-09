import { Alert, Platform } from "react-native";

export function confirmarAcao(
  titulo: string,
  mensagem: string,
  confirmar = "Confirmar",
  destrutivo = false,
): Promise<boolean> {
  if (Platform.OS === "web")
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensagem}`));
  return new Promise((resolve) =>
    Alert.alert(
      titulo,
      mensagem,
      [
        { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmar,
          style: destrutivo ? "destructive" : "default",
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
}

import { useCallback, useEffect, useRef } from "react";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
export function useSomNotificacao(ativado: boolean) {
  const player = useAudioPlayer(require("../../assets/sounds/notificacao.wav"));
  const ultimo = useRef(0);
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: false,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});
  }, []);
  return useCallback(() => {
    if (!ativado || Date.now() - ultimo.current < 700) return;
    ultimo.current = Date.now();
    void player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => {});
  }, [ativado, player]);
}

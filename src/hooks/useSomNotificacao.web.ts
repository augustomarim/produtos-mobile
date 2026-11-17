import { useCallback, useEffect, useRef } from "react";
export function useSomNotificacao(ativado: boolean) {
  const audio = useRef<AudioContext | null>(null);
  const ultimo = useRef(0);
  useEffect(() => {
    const liberar = () => {
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume().catch(() => {});
      } catch {}
    };
    document.addEventListener("pointerdown", liberar);
    document.addEventListener("keydown", liberar);
    return () => {
      document.removeEventListener("pointerdown", liberar);
      document.removeEventListener("keydown", liberar);
      void audio.current?.close();
    };
  }, []);
  return useCallback(() => {
    const ctx = audio.current;
    if (
      !ativado ||
      !ctx ||
      ctx.state !== "running" ||
      Date.now() - ultimo.current < 700
    )
      return;
    ultimo.current = Date.now();
    const gain = ctx.createGain();
    const os = ctx.createOscillator();
    os.frequency.setValueAtTime(880, ctx.currentTime);
    os.frequency.setValueAtTime(1174, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
    os.connect(gain);
    gain.connect(ctx.destination);
    os.start();
    os.stop(ctx.currentTime + 0.33);
    os.onended = () => {
      os.disconnect();
      gain.disconnect();
    };
  }, [ativado]);
}

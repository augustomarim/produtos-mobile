import { criarEstilosProdutos } from "@/hooks/use-tema-produtos";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "./AuthContext";
type Aviso = { texto: string; persistente: boolean; id: number };
const Context = createContext<(texto: string, persistente?: boolean) => void>(
  () => {},
);
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { estilos: s } = useEstilos();
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const { estado } = useAuth();
  const insets = useSafeAreaInsets();
  const avisar = useCallback(
    (texto: string, persistente = false) =>
      setAviso({ texto, persistente, id: Date.now() }),
    [],
  );
  useEffect(() => {
    if (estado !== "autenticado") {
      let ativo = true;
      void Promise.resolve().then(() => {
        if (ativo) setAviso(null);
      });
      return () => {
        ativo = false;
      };
    }
    if (!aviso || aviso.persistente) return;
    const timer = setTimeout(() => setAviso(null), 6500);
    return () => clearTimeout(timer);
  }, [aviso, estado]);
  return (
    <Context.Provider value={avisar}>
      {children}
      {estado === "autenticado" && aviso && (
        <View
          style={[
            s.toast,
            { top: insets.top + 8 },
            aviso.persistente && s.warning,
          ]}
        >
          <Text accessibilityRole="alert" style={s.text}>
            {aviso.texto}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar aviso"
            onPress={() => setAviso(null)}
            style={s.close}
          >
            <Text style={s.closeText}>×</Text>
          </Pressable>
        </View>
      )}
    </Context.Provider>
  );
}
export const useFeedback = () => useContext(Context);
const useEstilos = criarEstilosProdutos((cores) => StyleSheet.create({
  toast: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 100,
    backgroundColor: cores.destaqueSuave,
    borderWidth: 1,
    borderColor: cores.destaqueBorda,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  warning: { backgroundColor: cores.alertaSuave, borderColor: cores.alertaBorda },
  text: { flex: 1, color: cores.destaque, fontSize: 14, lineHeight: 21 },
  closeText: { color: cores.texto },
  close: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
}));

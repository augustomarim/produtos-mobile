import { Link } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { useNotificacoes } from "@/contexts/NotificacoesContext";
export default function NotificacoesBotao() {
  const { dados, erro } = useNotificacoes();
  const total = dados?.naoLidas || 0;
  return (
    <Link href="/notificacoes" asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Notificações${total ? `, ${total} não lidas` : ""}`}
        style={s.button}
      >
        <Text style={s.text}>
          Notificações {total ? `(${total})` : erro ? "· !" : ""}
        </Text>
      </Pressable>
    </Link>
  );
}
const s = StyleSheet.create({
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#ccd7df",
    borderRadius: 10,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginBottom: 16,
  },
  text: { fontSize: 15, fontWeight: "600", color: "#137c65" },
});

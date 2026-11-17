import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
        <Text style={s.text}>🔔 Notificações {erro ? "· !" : ""}</Text>
        {total > 0 && (
          <View style={s.badge}>
            <Text style={s.count}>{total > 99 ? "99+" : total}</Text>
          </View>
        )}
      </Pressable>
    </Link>
  );
}
const s = StyleSheet.create({
  badge: {
    backgroundColor: "#d33045",
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  count: { color: "white", fontSize: 11, fontWeight: "700" },
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
    flexDirection: "row",
    gap: 8,
  },
  text: { fontSize: 15, fontWeight: "600", color: "#137c65" },
});

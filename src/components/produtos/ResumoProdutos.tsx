import { StyleSheet, Text, View } from "react-native";
import type { PaginaProdutos } from "@/types/produto";
export default function ResumoProdutos({
  resumo,
}: {
  resumo?: PaginaProdutos["resumo"];
}) {
  return (
    <View style={s.container}>
      {[
        { title: "Total", value: resumo?.total },
        { title: "Ativos", value: resumo?.ativos },
        { title: "Inativos", value: resumo?.inativos },
      ].map((item) => (
        <View key={item.title} style={s.item}>
          <Text style={s.label}>{item.title}</Text>
          <Text style={[s.value, item.title === "Ativos" && s.active]}>
            {item.value ?? "—"}
          </Text>
        </View>
      ))}
    </View>
  );
}
const s = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5eaef",
    borderRadius: 12,
    paddingVertical: 18,
    marginBottom: 20,
  },
  item: { flex: 1, alignItems: "center" },
  label: { color: "#607483", fontSize: 12, marginBottom: 6 },
  value: { color: "#182b3a", fontSize: 24, fontWeight: "700" },
  active: { color: "#176b45" },
});

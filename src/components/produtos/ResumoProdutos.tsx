import { criarEstilosProdutos } from "@/hooks/use-tema-produtos";
import { StyleSheet, Text, View } from "react-native";
import type { PaginaProdutos } from "@/types/produto";
export default function ResumoProdutos({
  resumo,
}: {
  resumo?: PaginaProdutos["resumo"];
}) {
  const { estilos: s } = useEstilos();
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
const useEstilos = criarEstilosProdutos((cores) => StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    paddingVertical: 18,
    marginBottom: 20,
  },
  item: { flex: 1, alignItems: "center" },
  label: { color: cores.discreto, fontSize: 12, marginBottom: 6 },
  value: { color: cores.texto, fontSize: 24, fontWeight: "700" },
  active: { color: cores.destaque },
}));

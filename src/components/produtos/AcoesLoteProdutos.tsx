import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomTabInset } from "@/constants/theme";
import type { Produto } from "@/types/produto";
type Props = {
  selecionados: Produto[];
  desabilitado: boolean;
  acao: string | null;
  onAcao: (acao: "ativo" | "inativo" | "excluir") => void;
  onLimpar: () => void;
};
export default function AcoesLoteProdutos({
  selecionados,
  desabilitado,
  acao,
  onAcao,
  onLimpar,
}: Props) {
  if (!selecionados.length) return null;
  const ativos = selecionados.filter((p) => p.status === "ativo").length;
  const inativos = selecionados.length - ativos;
  return (
    <SafeAreaView edges={["bottom"]} style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>{selecionados.length} selecionados</Text>
        <Text style={s.hint}>
          {ativos} ativos · {inativos} inativos
        </Text>
        <View style={s.buttons}>
          {(
            [
              { valor: "ativo", titulo: "Ativar", bloqueado: !inativos },
              { valor: "inativo", titulo: "Inativar", bloqueado: !ativos },
              { valor: "excluir", titulo: "Excluir", bloqueado: false },
            ] as const
          ).map((item) => (
            <Pressable
              key={item.valor}
              accessibilityRole="button"
              accessibilityLabel={`${item.titulo} selecionados`}
              disabled={desabilitado || item.bloqueado}
              onPress={() => onAcao(item.valor)}
              style={[s.button, (desabilitado || item.bloqueado) && s.disabled]}
            >
              <Text style={[s.text, item.valor === "excluir" && s.danger]}>
                {acao === item.valor ? "Aguarde…" : item.titulo}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={desabilitado}
          onPress={onLimpar}
          style={s.clear}
        >
          <Text style={s.text}>Limpar seleção</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: {
    backgroundColor: "white",
    paddingBottom: BottomTabInset,
    borderTopWidth: 1,
    borderTopColor: "#dbe5e9",
  },
  container: { paddingHorizontal: 16, paddingTop: 12 },
  title: { color: "#182b3a", fontSize: 15, fontWeight: "700" },
  hint: { color: "#607483", fontSize: 12, marginTop: 4, marginBottom: 10 },
  buttons: { flexDirection: "row", gap: 8 },
  button: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccd7df",
    borderRadius: 9,
    padding: 12,
    minHeight: 44,
    alignItems: "center",
  },
  text: { color: "#137c65", fontWeight: "600", fontSize: 13 },
  danger: { color: "#a52b38" },
  disabled: { opacity: 0.4 },
  clear: { alignItems: "center", justifyContent: "center", minHeight: 44 },
});

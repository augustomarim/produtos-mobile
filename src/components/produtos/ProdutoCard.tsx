import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import CheckboxProduto from "./CheckboxProduto";
import ImagemProduto from "./ImagemProduto";
import { formatarData } from "@/lib/datas";
import type { Produto } from "@/types/produto";
type Props = {
  produto: Produto;
  selecionado: boolean;
  desabilitado: boolean;
  operacao?: "status" | "excluir";
  onSelecionar: () => void;
  onStatus: () => void;
  onExcluir: () => void;
};
export default function ProdutoCard({
  produto,
  selecionado,
  desabilitado,
  operacao,
  onSelecionar,
  onStatus,
  onExcluir,
}: Props) {
  const imagem = produto.foto_miniatura || produto.foto_produto;
  const ativo = produto.status === "ativo";
  return (
    <View style={[s.card, ativo && s.activeCard]}>
      <View style={s.header}>
        <CheckboxProduto
          label={`Selecionar ${produto.descricao_produto}`}
          marcado={selecionado}
          desabilitado={desabilitado}
          onPress={onSelecionar}
        />
        {imagem ? (
          <ImagemProduto
            uri={produto.foto_produto || imagem}
            miniatura={imagem}
            nome={produto.descricao_produto}
          />
        ) : (
          <View
            accessible
            accessibilityLabel="Produto sem foto disponível"
            style={[s.photo, s.placeholder]}
          >
            <Text style={s.placeholderText}>Sem foto</Text>
          </View>
        )}
        <View style={s.info}>
          <Text style={s.name}>{produto.descricao_produto}</Text>
          <Text style={s.code}>{produto.codigo_produto}</Text>
          <View style={[s.badge, ativo ? s.activeBadge : s.inactiveBadge]}>
            <Text
              style={[s.badgeText, { color: ativo ? "#176b45" : "#607483" }]}
            >
              {ativo ? "● Ativo" : "● Inativo"}
            </Text>
          </View>
        </View>
      </View>
      <View style={s.actions}>
        <Link
          href={{
            pathname: "/produtos/[id]/editar",
            params: { id: String(produto.id) },
          }}
          asChild
        >
          <Pressable
            accessibilityRole="button"
            disabled={desabilitado}
            style={StyleSheet.flatten([s.action, desabilitado && s.disabled])}
          >
            <Text style={s.actionText}>Editar</Text>
          </Pressable>
        </Link>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${ativo ? "Inativar" : "Ativar"} ${produto.descricao_produto}`}
          disabled={desabilitado}
          onPress={onStatus}
          style={[s.action, desabilitado && s.disabled]}
        >
          <Text style={s.actionText}>
            {operacao === "status"
              ? "Atualizando…"
              : ativo
                ? "Inativar"
                : "Ativar"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Excluir ${produto.descricao_produto}`}
          disabled={desabilitado}
          onPress={onExcluir}
          style={[s.action, desabilitado && s.disabled]}
        >
          <Text style={s.danger}>
            {operacao === "excluir" ? "Excluindo…" : "Excluir"}
          </Text>
        </Pressable>
      </View>
      <View style={s.dates}>
        <Text style={s.date}>Criado: {formatarData(produto.createdAt)}</Text>
        <Text style={s.date}>Alterado: {formatarData(produto.updatedAt)}</Text>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  action: {
    flex: 1,
    minWidth: 75,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    padding: 9,
    borderWidth: 1,
    borderColor: "#dbe4ea",
    borderRadius: 9,
  },
  actionText: { fontSize: 13, fontWeight: "600", color: "#137c65" },
  danger: { fontSize: 13, fontWeight: "600", color: "#a52b38" },
  disabled: { opacity: 0.45 },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5eaef",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  activeCard: { borderLeftWidth: 4, borderLeftColor: "#137c65" },
  header: { flexDirection: "row", gap: 14, alignItems: "flex-start" },
  photo: { width: 68, height: 68, borderRadius: 10 },
  placeholder: {
    backgroundColor: "#eef3f6",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "#607483", fontSize: 11 },
  info: { flex: 1 },
  name: { color: "#182b3a", fontSize: 17, fontWeight: "600", marginBottom: 5 },
  code: { color: "#607483", fontSize: 13, marginBottom: 9 },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeBadge: { backgroundColor: "#eaf6ef" },
  inactiveBadge: { backgroundColor: "#eef1f4" },
  badgeText: { fontSize: 12, fontWeight: "600" },
  dates: {
    borderTopWidth: 1,
    borderTopColor: "#edf1f4",
    paddingTop: 12,
    marginTop: 14,
    gap: 5,
  },
  date: { color: "#607483", fontSize: 12, lineHeight: 18 },
});

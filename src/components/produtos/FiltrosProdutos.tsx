import { criarEstilosProdutos } from "@/hooks/use-tema-produtos";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { FiltroStatus } from "@/types/produto";
type Props = {
  busca: string;
  filtro: FiltroStatus;
  desabilitado: boolean;
  onAlterar: (busca: string, filtro: FiltroStatus) => void;
};
const opcoes: { valor: FiltroStatus; titulo: string }[] = [
  { valor: "todos", titulo: "Todos" },
  { valor: "ativo", titulo: "Ativos" },
  { valor: "inativo", titulo: "Inativos" },
];
export default function FiltrosProdutos({
  busca,
  filtro,
  desabilitado,
  onAlterar,
}: Props) {
  const { cores, estilos: s } = useEstilos();
  return (
    <View style={s.container}>
      <Text style={s.label}>Buscar produto</Text>
      <TextInput
        accessibilityLabel="Buscar produtos"
        value={busca}
        onChangeText={(texto) => onAlterar(texto, filtro)}
        placeholder="Buscar por nome"
        placeholderTextColor={cores.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={120}
        editable={!desabilitado}
        returnKeyType="search"
        style={s.input}
      />
      <View style={s.options}>
        {opcoes.map((opcao) => (
          <Pressable
            key={opcao.valor}
            accessibilityRole="button"
            accessibilityState={{
              selected: filtro === opcao.valor,
              disabled: desabilitado,
            }}
            disabled={desabilitado}
            onPress={() => {
              if (filtro !== opcao.valor) onAlterar(busca, opcao.valor);
            }}
            style={[
              s.option,
              filtro === opcao.valor && s.selected,
              desabilitado && s.disabled,
            ]}
          >
            <Text
              style={[s.optionText, filtro === opcao.valor && s.selectedText]}
            >
              {opcao.titulo}
            </Text>
          </Pressable>
        ))}
      </View>
      {(busca.length > 0 || filtro !== "todos") && (
        <Pressable
          accessibilityRole="button"
          disabled={desabilitado}
          onPress={() => onAlterar("", "todos")}
          style={s.clear}
        >
          <Text style={s.selectedText}>Limpar filtros</Text>
        </Pressable>
      )}
    </View>
  );
}
const useEstilos = criarEstilosProdutos((cores) => StyleSheet.create({
  container: { marginBottom: 20 },
  label: { color: cores.texto, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: cores.bordaControle,
    borderRadius: 10,
    backgroundColor: cores.superficie,
    color: cores.texto,
    fontSize: 16,
    padding: 14,
    marginBottom: 12,
  },
  options: { flexDirection: "row", gap: 8 },
  option: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: cores.bordaControle,
    borderRadius: 9,
    backgroundColor: cores.superficie,
    padding: 10,
  },
  selected: { borderColor: cores.destaque, backgroundColor: cores.destaqueSuave },
  optionText: { color: cores.discreto, fontSize: 14, fontWeight: "600" },
  selectedText: { color: cores.destaque, fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.5 },
  clear: {
    alignSelf: "flex-start",
    minHeight: 44,
    justifyContent: "center",
    marginTop: 4,
  },
}));

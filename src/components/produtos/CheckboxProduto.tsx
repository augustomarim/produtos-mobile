import { criarEstilosProdutos } from "@/hooks/use-tema-produtos";
import { Pressable, StyleSheet, Text } from "react-native";
export default function CheckboxProduto({
  label,
  marcado,
  parcial = false,
  desabilitado = false,
  onPress,
}: {
  label: string;
  marcado: boolean;
  parcial?: boolean;
  desabilitado?: boolean;
  onPress: () => void;
}) {
  const { estilos: s } = useEstilos();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{
        checked: parcial ? "mixed" : marcado,
        disabled: desabilitado,
      }}
      disabled={desabilitado}
      onPress={onPress}
      style={[
        s.box,
        (marcado || parcial) && s.checked,
        desabilitado && s.disabled,
      ]}
    >
      <Text style={s.text}>{parcial ? "−" : marcado ? "✓" : ""}</Text>
    </Pressable>
  );
}
const useEstilos = criarEstilosProdutos((cores) => StyleSheet.create({
  box: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    borderColor: cores.bordaControle,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: cores.superficie,
  },
  checked: { backgroundColor: cores.botao, borderColor: cores.destaque },
  text: { color: "white", fontSize: 20, fontWeight: "700" },
  disabled: { opacity: 0.5 },
}));

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
const s = StyleSheet.create({
  box: {
    minWidth: 44,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#bdcdd5",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  checked: { backgroundColor: "#137c65", borderColor: "#137c65" },
  text: { color: "white", fontSize: 20, fontWeight: "700" },
  disabled: { opacity: 0.5 },
});

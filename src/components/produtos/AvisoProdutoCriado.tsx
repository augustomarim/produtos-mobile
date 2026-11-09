import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
export default function AvisoProdutoCriado() {
  const [visivel, setVisivel] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setVisivel(false), 6500);
    return () => clearTimeout(timer);
  }, []);
  if (!visivel) return null;
  return (
    <View style={s.container}>
      <Text accessibilityRole="alert" style={s.text}>
        Produto cadastrado com sucesso.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fechar aviso"
        onPress={() => setVisivel(false)}
        style={s.close}
      >
        <Text style={s.text}>×</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  container: {
    backgroundColor: "#eaf6ef",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  text: { color: "#176b45", fontSize: 14 },
  close: {
    minHeight: 44,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});

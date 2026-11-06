import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
type Props = { carregando: boolean; erro: string; temProdutos: boolean };
export default function EstadoLista({ carregando, erro, temProdutos }: Props) {
  return (
    <View style={s.container}>
      {carregando ? (
        <>
          <ActivityIndicator size="large" color="#137c65" />
          <Text style={s.text}>Carregando seus produtos…</Text>
        </>
      ) : erro ? (
        <Text style={s.text}>Sua lista ainda não pôde ser carregada.</Text>
      ) : (
        <>
          <Text style={s.title}>
            {temProdutos
              ? "Nenhum produto encontrado"
              : "Seu catálogo começa aqui"}
          </Text>
          <Text style={s.text}>
            {temProdutos
              ? "Altere o nome buscado ou o filtro de status."
              : "Nenhum produto cadastrado nesta conta."}
          </Text>
        </>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  title: {
    color: "#182b3a",
    fontSize: 21,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  text: {
    color: "#607483",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    marginTop: 14,
  },
});

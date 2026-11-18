import { criarEstilosProdutos } from "@/hooks/use-tema-produtos";
import { Pressable, StyleSheet, Text, View } from "react-native";
type Props = {
  pagina: number;
  paginas: number;
  desabilitado: boolean;
  onMudar: (pagina: number) => void;
};
export default function PaginacaoProdutos({
  pagina,
  paginas,
  desabilitado,
  onMudar,
}: Props) {
  const { estilos: s } = useEstilos();
  return (
    <View style={s.container}>
      <Text style={s.label}>
        Página {pagina} de {paginas}
      </Text>
      <View style={s.buttons}>
        {[
          { titulo: "Anterior", destino: pagina - 1, bloqueado: pagina <= 1 },
          {
            titulo: "Próxima",
            destino: pagina + 1,
            bloqueado: pagina >= paginas,
          },
        ].map((item) => (
          <Pressable
            key={item.titulo}
            accessibilityRole="button"
            disabled={desabilitado || item.bloqueado}
            onPress={() => onMudar(item.destino)}
            style={[s.button, (desabilitado || item.bloqueado) && s.disabled]}
          >
            <Text style={s.text}>{item.titulo}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
const useEstilos = criarEstilosProdutos((cores) => StyleSheet.create({
  container: { marginTop: 8, paddingVertical: 14 },
  label: {
    color: cores.discreto,
    fontSize: 13,
    textAlign: "center",
    marginBottom: 14,
  },
  buttons: { flexDirection: "row", gap: 12 },
  button: {
    flex: 1,
    alignItems: "center",
    backgroundColor: cores.superficie,
    borderWidth: 1,
    borderColor: cores.bordaControle,
    borderRadius: 8,
    padding: 12,
  },
  text: { color: cores.secundario, fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.45 },
}));

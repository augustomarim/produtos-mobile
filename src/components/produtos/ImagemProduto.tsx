import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageStyle,
  type StyleProp,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
type Props = {
  uri: string;
  miniatura?: string | null;
  nome: string;
  style?: StyleProp<ImageStyle>;
};
function Visualizador({
  uri,
  nome,
  fechar,
}: {
  uri: string;
  nome: string;
  fechar: () => void;
}) {
  const [erro, setErro] = useState(false);
  const [carregando, setCarregando] = useState(true);
  return (
    <Modal visible transparent animationType="fade" onRequestClose={fechar}>
      <SafeAreaView style={s.overlay}>
        <View style={s.dialog} accessibilityViewIsModal>
          <Text style={s.title}>{nome}</Text>
          {erro ? (
            <Text accessibilityRole="alert" style={s.light}>
              Não foi possível carregar esta foto.
            </Text>
          ) : (
            <Image
              source={{ uri }}
              accessibilityLabel={`Foto ampliada de ${nome}`}
              resizeMode="contain"
              style={s.large}
              onLoadEnd={() => setCarregando(false)}
              onError={() => {
                setErro(true);
                setCarregando(false);
              }}
            />
          )}
          {carregando && <ActivityIndicator color="white" />}
          <Pressable
            accessibilityRole="button"
            onPress={fechar}
            style={s.close}
          >
            <Text style={s.closeText}>Fechar foto</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
export default function ImagemProduto({ uri, miniatura, nome, style }: Props) {
  const [aberta, setAberta] = useState(false);
  const [falhou, setFalhou] = useState<string | null>(null);
  const src = miniatura || uri;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ampliar foto de ${nome}`}
        onPress={() => setAberta(true)}
      >
        {falhou === src ? (
          <View style={[s.thumb, style, s.empty]}>
            <Text>Sem foto</Text>
          </View>
        ) : (
          <Image
            accessibilityLabel={`Foto de ${nome}`}
            source={{ uri: src }}
            style={[s.thumb, style]}
            resizeMode="contain"
            onError={() => setFalhou(src)}
          />
        )}
      </Pressable>
      {aberta && (
        <Visualizador uri={uri} nome={nome} fechar={() => setAberta(false)} />
      )}
    </>
  );
}
const s = StyleSheet.create({
  thumb: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: "#f0f4f7",
  },
  empty: { alignItems: "center", justifyContent: "center" },
  overlay: {
    flex: 1,
    backgroundColor: "#132a32ed",
    justifyContent: "center",
    padding: 20,
  },
  dialog: { flex: 1, justifyContent: "center", gap: 16 },
  title: { color: "white", fontSize: 20, fontWeight: "600" },
  light: { color: "white", fontSize: 15 },
  large: { width: "100%", flex: 1 },
  close: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    minHeight: 48,
  },
  closeText: { color: "#137c65", fontWeight: "700" },
});

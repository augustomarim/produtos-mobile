import { useCallback } from "react";
import { Stack, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNotificacoes } from "@/contexts/NotificacoesContext";
import {
  dataNotificacao,
  detalhesNotificacao,
  origemNotificacao,
  tituloNotificacao,
} from "@/lib/notificacoes";
export default function NotificacoesScreen() {
  const {
    dados,
    erro,
    carregando,
    marcando,
    atualizar,
    marcarLidas,
    mudarPagina,
    conexao,
    som,
    alternarSom,
  } = useNotificacoes();
  useFocusEffect(
    useCallback(() => {
      void atualizar();
    }, [atualizar]),
  );
  const itens = dados?.notificacoes || [];
  const naoLidas = itens.filter((n) => !n.lida);
  const ocupado = carregando || marcando;
  return (
    <SafeAreaView style={s.screen} edges={["left", "right", "bottom"]}>
      <Stack.Screen
        options={{
          title: "Notificações",
          headerShown: true,
          headerBackTitle: "Voltar",
          headerTintColor: "#137c65",
        }}
      />
      <FlatList
        data={itens}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={s.content}
        refreshing={carregando}
        onRefresh={() => {
          if (!marcando) void atualizar();
        }}
        ListHeaderComponent={
          <View>
            <Text style={s.title}>Suas notificações</Text>
            <Text style={s.hint}>
              Histórico completo do site e do aplicativo. Som e avisos
              flutuantes são exibidos somente para ações feitas no site.
            </Text>
            <Text style={s.hint}>
              {dados?.naoLidas || 0} não lidas ·{" "}
              {conexao === "conectado"
                ? "Em tempo real"
                : conexao === "conectando"
                  ? "Conectando…"
                  : "Reconectando…"}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={alternarSom}
              style={s.button}
            >
              <Text style={s.buttonText}>
                {som ? "Silenciar notificações" : "Ativar som das notificações"}
              </Text>
            </Pressable>
            <View style={s.actions}>
              <Pressable
                accessibilityRole="button"
                disabled={ocupado}
                onPress={() => void atualizar()}
                style={[s.button, ocupado && s.disabled]}
              >
                <Text style={s.buttonText}>Atualizar notificações</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={ocupado || !naoLidas.length}
                onPress={() => void marcarLidas(naoLidas)}
                style={[s.button, (ocupado || !naoLidas.length) && s.disabled]}
              >
                <Text style={s.buttonText}>
                  {marcando ? "Marcando…" : "Marcar exibidas como lidas"}
                </Text>
              </Pressable>
            </View>
            {!!erro && (
              <Text accessibilityRole="alert" style={s.error}>
                {erro}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          carregando ? (
            <ActivityIndicator
              accessibilityLabel="Carregando notificações"
              color="#137c65"
            />
          ) : !erro ? (
            <Text style={s.hint}>Nenhuma notificação por enquanto.</Text>
          ) : undefined
        }
        ListFooterComponent={
          dados && dados.paginas > 1 ? (
            <View style={s.actions}>
              <Text style={s.hint}>
                Página {dados.pagina} de {dados.paginas}
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={ocupado || dados.pagina <= 1}
                onPress={() => mudarPagina(dados.pagina - 1)}
                style={[s.button, (ocupado || dados.pagina <= 1) && s.disabled]}
              >
                <Text style={s.buttonText}>Anteriores</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={ocupado || dados.pagina >= dados.paginas}
                onPress={() => mudarPagina(dados.pagina + 1)}
                style={[
                  s.button,
                  (ocupado || dados.pagina >= dados.paginas) && s.disabled,
                ]}
              >
                <Text style={s.buttonText}>Próximas</Text>
              </Pressable>
            </View>
          ) : undefined
        }
        renderItem={({ item: n }) => (
          <View style={[s.card, !n.lida && s.unread]}>
            <View style={s.heading}>
              <Text style={s.cardTitle}>{tituloNotificacao(n)}</Text>
              <Text style={s.status}>{n.lida ? "Lida" : "Não lida"}</Text>
            </View>
            <Text style={s.name}>{n.descricao}</Text>
            <Text style={s.hint}>{n.codigo}</Text>
            {n.acao === "editado" && (
              <Text style={s.details}>{detalhesNotificacao(n)}</Text>
            )}
            <Text style={s.hint}>
              {origemNotificacao(n)} · {dataNotificacao(n.ocorreuEm)}
            </Text>
            {!n.lida && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Marcar notificação de ${n.descricao} como lida`}
                disabled={ocupado}
                style={[s.read, ocupado && s.disabled]}
                onPress={() => void marcarLidas([n])}
              >
                <Text style={s.buttonText}>Marcar como lida</Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f5f7f9" },
  content: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  title: {
    color: "#182b3a",
    fontSize: 27,
    fontWeight: "700",
    marginBottom: 12,
  },
  hint: { color: "#607483", fontSize: 13, lineHeight: 21, marginBottom: 8 },
  actions: { gap: 8, marginTop: 10, marginBottom: 20 },
  button: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#ccd7df",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: "#137c65", fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.45 },
  error: { color: "#a52b38", fontSize: 14, lineHeight: 22, marginBottom: 16 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dce5ea",
    padding: 16,
    marginBottom: 14,
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: "#137c65",
    backgroundColor: "#f1faf6",
  },
  heading: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#182b3a" },
  status: { fontSize: 12, color: "#137c65" },
  name: { fontSize: 17, fontWeight: "600", color: "#182b3a", marginBottom: 6 },
  details: { fontSize: 14, color: "#425868", lineHeight: 22, marginBottom: 12 },
  read: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
    paddingVertical: 8,
  },
});

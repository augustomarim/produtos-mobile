import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '');

type Status = 'aguardando' | 'conectando' | 'conectado' | 'erro';

export default function HomeScreen() {
  const [status, setStatus] = useState<Status>('aguardando');
  const [mensagem, setMensagem] = useState(
    'Toque no botão para verificar a conexão com o servidor.'
  );

  const requisicao = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      const atual = requisicao.current;
      requisicao.current = null;
      atual?.abort();
    };
  }, []);

  async function testarConexao() {
    // Impede dois pedidos simultâneos, inclusive antes de atualizar a tela.
    if (requisicao.current) return;

    if (!API_URL) {
      setStatus('erro');
      setMensagem(
        'Configure EXPO_PUBLIC_API_URL no arquivo .env e reinicie o Expo.'
      );
      return;
    }

    const controller = new AbortController();
    requisicao.current = controller;

    setStatus('conectando');
    setMensagem(
      'Consultando o servidor. A primeira conexão com o Render pode demorar.'
    );

    const timeout = setTimeout(() => {
      controller.abort();
    }, 60_000);

    try {
      const resposta = await fetch(`${API_URL}/health`, {
        signal: controller.signal,
      });

      if (!resposta.ok) {
        throw new Error(`O servidor respondeu com erro ${resposta.status}.`);
      }

      const dados = await resposta.json();

      if (dados.status !== 'ok') {
        throw new Error('O servidor retornou uma resposta inesperada.');
      }

      if (requisicao.current !== controller) return;

      setStatus('conectado');
      setMensagem('Seu iPhone conseguiu se conectar ao backend!');
    } catch (error) {
      if (requisicao.current !== controller) return;

      setStatus('erro');

      if (controller.signal.aborted) {
        setMensagem(
          'O servidor demorou para responder. Aguarde um pouco e tente novamente.'
        );
      } else {
        setMensagem(
          error instanceof Error
            ? `Não foi possível confirmar a conexão. ${error.message}`
            : 'Verifique sua conexão com a internet e tente novamente.'
        );
      }
    } finally {
      clearTimeout(timeout);

      if (requisicao.current === controller) {
        requisicao.current = null;
      }
    }
  }

  const conectando = status === 'conectando';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>PRODUTOS MOBILE</Text>

        <Text style={styles.title}>Vamos conectar seu catálogo</Text>

        <Text style={styles.description}>
          Este aplicativo usará o mesmo servidor e as mesmas contas do site.
          Cada usuário terá acesso somente aos próprios produtos.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conexão com o servidor</Text>

          <Text style={styles.address}>
            {API_URL || 'Endereço ainda não configurado'}
          </Text>

          <View
            style={[
              styles.feedback,
              status === 'conectado' && styles.feedbackSuccess,
              status === 'erro' && styles.feedbackError,
            ]}
          >
            {conectando && (
              <ActivityIndicator color="#137c65" style={styles.spinner} />
            )}

            <Text
              accessibilityLiveRegion="polite"
              style={[
                styles.message,
                status === 'conectado' && styles.successText,
                status === 'erro' && styles.errorText,
              ]}
            >
              {mensagem}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: conectando, busy: conectando }}
            disabled={conectando}
            onPress={() => void testarConexao()}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              conectando && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {conectando
                ? 'Conectando…'
                : status === 'conectado'
                  ? 'Testar novamente'
                  : 'Testar conexão'}
            </Text>
          </Pressable>

          <Text style={styles.hint}>
            Esta verificação não cria, altera ou exclui dados.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f7f9',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
  },
  eyebrow: {
    color: '#137c65',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    color: '#182b3a',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 16,
  },
  description: {
    color: '#607483',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e5eaef',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    color: '#182b3a',
    fontSize: 19,
    fontWeight: '600',
    marginBottom: 10,
  },
  address: {
    color: '#607483',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  feedback: {
    backgroundColor: '#f0f4f7',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  feedbackSuccess: {
    backgroundColor: '#eaf6ef',
  },
  feedbackError: {
    backgroundColor: '#fff0f0',
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    color: '#425868',
    fontSize: 15,
    lineHeight: 22,
  },
  successText: {
    color: '#176b45',
  },
  errorText: {
    color: '#a52b38',
  },
  button: {
    backgroundColor: '#137c65',
    borderRadius: 10,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: '#607483',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
  },
});
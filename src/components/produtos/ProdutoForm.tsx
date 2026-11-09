import { useRef, useState, type ComponentRef } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { useFotoProduto } from '@/hooks/useFotoProduto';
import { ApiError } from '@/lib/api';
import type { DadosProdutoForm } from '@/types/produto';
export type { DadosProdutoForm } from '@/types/produto';

type Props = {
  onSalvar: (dados: DadosProdutoForm) => Promise<void>;
  onCancelar?: () => void;
  codigoInicial?: string;
  descricaoInicial?: string;
  textoBotao?: string;
};

type ErrosCampos = {
  codigo?: string;
  descricao?: string;
  foto?: string;
};

export default function ProdutoForm({
  onSalvar,
  onCancelar,
  codigoInicial = '',
  descricaoInicial = '',
  textoBotao = 'Salvar produto',
}: Props) {
  const [codigo, setCodigo] = useState(codigoInicial);
  const [descricao, setDescricao] = useState(descricaoInicial);
  const [erros, setErros] = useState<ErrosCampos>({});
  const [erroGeral, setErroGeral] = useState('');
  const [salvando, setSalvando] = useState(false);

  const codigoRef = useRef<ComponentRef<typeof TextInput>>(null);
  const descricaoRef = useRef<ComponentRef<typeof TextInput>>(null);
  const envioEmAndamento = useRef(false);

  const {
    foto,
    erroFoto,
    preparandoFoto,
    escolherFoto,
    limparFoto,
  } = useFotoProduto();

  const ocupado = salvando || preparandoFoto;
  const mensagemFoto = erroFoto || erros.foto;

  function focarPrimeiroErro(campos: ErrosCampos) {
    requestAnimationFrame(() => {
      if (campos.codigo) {
        codigoRef.current?.focus();
      } else if (campos.descricao) {
        descricaoRef.current?.focus();
      }
    });
  }

  async function salvar() {
    if (envioEmAndamento.current || preparandoFoto) return;

    setErroGeral('');

    const novosErros: ErrosCampos = {};

    if (!codigo.trim()) {
      novosErros.codigo = 'Informe o código do produto.';
    }

    if (!descricao.trim()) {
      novosErros.descricao = 'Informe a descrição do produto.';
    }

    if (mensagemFoto) {
      novosErros.foto = mensagemFoto;
    }

    setErros(novosErros);

    if (Object.keys(novosErros).length > 0) {
      focarPrimeiroErro(novosErros);
      return;
    }

    envioEmAndamento.current = true;
    setSalvando(true);

    try {
      await onSalvar({
        codigo_produto: codigo.trim(),
        descricao_produto: descricao.trim(),
        foto,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        const errosApi: ErrosCampos = {};

        for (const detalhe of error.details) {
          if (detalhe.field === 'codigo_produto') {
            errosApi.codigo = detalhe.message;
          }

          if (detalhe.field === 'descricao_produto') {
            errosApi.descricao = detalhe.message;
          }

          if (detalhe.field === 'foto_produto') {
            errosApi.foto = detalhe.message;
          }
        }

        if (error.status === 409) {
          errosApi.codigo =
            'Este código já está sendo usado na sua conta.';
        }

        if (error.status === 413) {
          errosApi.foto =
            'A foto excede o tamanho permitido. Escolha outra imagem.';
        }

        if (Object.keys(errosApi).length > 0) {
          setErros(errosApi);
          focarPrimeiroErro(errosApi);
          return;
        }
      }

      setErroGeral(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o produto. Tente novamente.'
      );
    } finally {
      envioEmAndamento.current = false;
      setSalvando(false);
    }
  }

  async function selecionarFoto() {
    if (envioEmAndamento.current || preparandoFoto) return;

    setErros((anteriores) => ({
      ...anteriores,
      foto: undefined,
    }));

    await escolherFoto();
  }

  function removerSelecao() {
    if (ocupado) return;

    limparFoto();

    setErros((anteriores) => ({
      ...anteriores,
      foto: undefined,
    }));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        Os campos com * são obrigatórios.
      </Text>

      <View style={styles.field}>
        <Text style={styles.label}>Código *</Text>

        <TextInput
          ref={codigoRef}
          accessibilityLabel="Código do produto"
          accessibilityHint={erros.codigo}
          value={codigo}
          onChangeText={(valor) => {
            setCodigo(valor);
            setErroGeral('');

            setErros((anteriores) => ({
              ...anteriores,
              codigo: undefined,
            }));
          }}
          editable={!ocupado}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Ex.: AG-001"
          placeholderTextColor="#83939e"
          returnKeyType="next"
          onSubmitEditing={() => descricaoRef.current?.focus()}
          style={[
            styles.input,
            !!erros.codigo && styles.inputError,
          ]}
        />

        {!!erros.codigo && (
          <Text accessibilityRole="alert" style={styles.fieldError}>
            {erros.codigo}
          </Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Descrição *</Text>

        <TextInput
          ref={descricaoRef}
          accessibilityLabel="Descrição do produto"
          accessibilityHint={erros.descricao}
          value={descricao}
          onChangeText={(valor) => {
            setDescricao(valor);
            setErroGeral('');

            setErros((anteriores) => ({
              ...anteriores,
              descricao: undefined,
            }));
          }}
          editable={!ocupado}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholder="Como este produto deve aparecer no catálogo?"
          placeholderTextColor="#83939e"
          style={[
            styles.input,
            styles.textarea,
            !!erros.descricao && styles.inputError,
          ]}
        />

        {!!erros.descricao && (
          <Text accessibilityRole="alert" style={styles.fieldError}>
            {erros.descricao}
          </Text>
        )}
      </View>

      <View style={styles.photoSection}>
        <Text style={styles.label}>Foto do produto</Text>

        <Text style={styles.hint}>
          Opcional · A imagem será preparada em JPEG · até 4 MB
        </Text>

        {foto ? (
          <View>
            <Image
              accessibilityLabel="Pré-visualização da foto selecionada"
              source={{ uri: foto.uri }}
              style={styles.preview}
              resizeMode="contain"
            />

            <Text style={styles.photoInfo}>
              Foto preparada ·{' '}
              {(foto.tamanho / (1024 * 1024))
                .toFixed(2)
                .replace('.', ',')}{' '}
              MB
            </Text>
          </View>
        ) : (
          <View
            accessible
            accessibilityLabel="Nenhuma foto selecionada"
            style={styles.placeholder}
          >
            <Text style={styles.placeholderText}>
              Nenhuma foto selecionada
            </Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            disabled: ocupado,
            busy: preparandoFoto,
          }}
          disabled={ocupado}
          onPress={() => void selecionarFoto()}
          style={({ pressed }) => [
            styles.secondaryButton,
            (pressed || ocupado) && styles.disabled,
          ]}
        >
          {preparandoFoto && (
            <ActivityIndicator
              color="#137c65"
              style={styles.spinner}
            />
          )}

          <Text style={styles.secondaryButtonText}>
            {preparandoFoto
              ? 'Preparando foto…'
              : foto
                ? 'Escolher outra foto'
                : 'Escolher foto'}
          </Text>
        </Pressable>

        {(foto || mensagemFoto) && (
          <Pressable
            accessibilityRole="button"
            disabled={ocupado}
            onPress={removerSelecao}
            style={[
              styles.removeButton,
              ocupado && styles.disabled,
            ]}
          >
            <Text style={styles.removeText}>
              {foto
                ? 'Remover foto selecionada'
                : 'Remover seleção inválida'}
            </Text>
          </Pressable>
        )}

        {!!mensagemFoto && (
          <Text accessibilityRole="alert" style={styles.fieldError}>
            {mensagemFoto}
          </Text>
        )}
      </View>

      {!!erroGeral && (
        <View style={styles.errorBox}>
          <Text accessibilityRole="alert" style={styles.errorText}>
            {erroGeral}
          </Text>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: ocupado,
          busy: salvando,
        }}
        disabled={ocupado}
        onPress={() => void salvar()}
        style={({ pressed }) => [
          styles.primaryButton,
          (pressed || ocupado) && styles.disabled,
        ]}
      >
        {salvando && (
          <ActivityIndicator
            color="#ffffff"
            style={styles.spinner}
          />
        )}

        <Text style={styles.primaryButtonText}>
          {salvando ? 'Salvando produto…' : textoBotao}
        </Text>
      </Pressable>

      {onCancelar && (
        <Pressable
          accessibilityRole="button"
          disabled={ocupado}
          onPress={onCancelar}
          style={({ pressed }) => [
            styles.secondaryButton,
            styles.cancelButton,
            (pressed || ocupado) && styles.disabled,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5eaef',
    borderRadius: 16,
    padding: 20,
  },
  field: {
    marginTop: 20,
  },
  label: {
    color: '#182b3a',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  hint: {
    color: '#607483',
    fontSize: 13,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ccd7df',
    borderRadius: 10,
    padding: 14,
    color: '#182b3a',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#b42333',
  },
  textarea: {
    minHeight: 110,
  },
  fieldError: {
    color: '#b42333',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  photoSection: {
    marginTop: 28,
    marginBottom: 28,
  },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#f0f4f7',
    marginTop: 16,
  },
  photoInfo: {
    color: '#607483',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  placeholder: {
    height: 150,
    borderRadius: 10,
    backgroundColor: '#f0f4f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 14,
  },
  placeholderText: {
    color: '#607483',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#137c65',
    minHeight: 48,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ccd7df',
    minHeight: 48,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#137c65',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
  },
  removeButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 4,
  },
  removeText: {
    color: '#b42333',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fff0f0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    color: '#a52b38',
    fontSize: 14,
    lineHeight: 21,
  },
  disabled: {
    opacity: 0.55,
  },
  spinner: {
    marginRight: 10,
  },
});
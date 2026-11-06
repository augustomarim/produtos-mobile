import {
    ImageManipulator,
    SaveFormat,
} from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';

import type { FotoProduto } from '@/types/foto';

const TAMANHO_MAXIMO = 4 * 1024 * 1024;
const DIMENSAO_MAXIMA = 1600;

function calcularTamanho(base64: string) {
  const preenchimento = base64.endsWith('==')
    ? 2
    : base64.endsWith('=')
      ? 1
      : 0;

  return (base64.length * 3) / 4 - preenchimento;
}

export function useFotoProduto() {
  const [foto, setFoto] = useState<FotoProduto | null>(null);
  const [erroFoto, setErroFoto] = useState('');
  const [preparandoFoto, setPreparandoFoto] = useState(false);

  const emAndamento = useRef(false);
  const versaoOperacao = useRef(0);

  useEffect(() => {
    return () => {
      // Ignora resultados que chegarem depois de sair da tela.
      versaoOperacao.current++;
    };
  }, []);

  async function escolherFoto() {
    if (emAndamento.current) return;

    emAndamento.current = true;

    const versao = ++versaoOperacao.current;

    setPreparandoFoto(true);
    setErroFoto('');

    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 1,
        exif: false,
      });

      if (versao !== versaoOperacao.current) return;

      // Cancelar a galeria mantém a foto anteriormente selecionada.
      if (resultado.canceled) return;

      const arquivo = resultado.assets[0];

      if (!arquivo?.uri) {
        throw new Error('Não foi possível acessar a foto selecionada.');
      }

      setFoto(null);

      const contexto = ImageManipulator.manipulate(arquivo.uri);

      try {
        // Reduz imagens grandes sem aumentar as pequenas.
        if (
          arquivo.width > DIMENSAO_MAXIMA ||
          arquivo.height > DIMENSAO_MAXIMA
        ) {
          contexto.resize(
            arquivo.width >= arquivo.height
              ? { width: DIMENSAO_MAXIMA }
              : { height: DIMENSAO_MAXIMA }
          );
        }

        const imagem = await contexto.renderAsync();

        try {
          const preparada = await imagem.saveAsync({
            format: SaveFormat.JPEG,
            compress: 0.8,
            base64: true,
          });

          if (versao !== versaoOperacao.current) return;

          if (!preparada.base64) {
            throw new Error(
              'Não foi possível verificar o tamanho da foto.'
            );
          }

          const tamanho = calcularTamanho(preparada.base64);

          if (tamanho > TAMANHO_MAXIMO) {
            setErroFoto(
              'A foto preparada ainda ultrapassa 4 MB. Escolha outra imagem.'
            );
            return;
          }

          // Guardamos somente os dados necessários para o upload.
          // O conteúdo base64 não fica no estado da tela.
          setFoto({
            uri: preparada.uri,
            name: `produto-${Date.now()}.jpg`,
            type: 'image/jpeg',
            tamanho,
          });
        } finally {
          imagem.release();
        }
      } finally {
        contexto.release();
      }
    } catch {
      if (versao !== versaoOperacao.current) return;

      setErroFoto(
        'Não foi possível preparar esta foto. Escolha outra imagem e tente novamente.'
      );
    } finally {
      emAndamento.current = false;

      if (versao === versaoOperacao.current) {
        setPreparandoFoto(false);
      }
    }
  }

  function limparFoto() {
    if (emAndamento.current) return;

    setFoto(null);
    setErroFoto('');
  }

  return {
    foto,
    erroFoto,
    preparandoFoto,
    escolherFoto,
    limparFoto,
  };
}
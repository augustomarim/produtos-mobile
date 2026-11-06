import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";

import { FotoInvalidaError, prepararFoto } from "@/lib/prepararFoto";

import type { FotoProduto } from "@/types/foto";

export function useFotoProduto() {
  const [foto, setFoto] = useState<FotoProduto | null>(null);
  const [erroFoto, setErroFoto] = useState("");
  const [preparandoFoto, setPreparandoFoto] = useState(false);

  const emAndamento = useRef(false);
  const versaoOperacao = useRef(0);

  useEffect(() => {
    const operacaoRef = versaoOperacao;
    return () => {
      // Ignora resultados que chegarem depois de sair da tela.
      operacaoRef.current++;
    };
  }, []);

  async function escolherFoto() {
    if (emAndamento.current) return;

    emAndamento.current = true;

    const versao = ++versaoOperacao.current;

    setPreparandoFoto(true);
    setErroFoto("");

    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
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
        throw new Error("Não foi possível acessar a foto selecionada.");
      }

      setFoto(null);

      const preparada = await prepararFoto(arquivo);

      if (versao === versaoOperacao.current) {
        setFoto(preparada);
      }
    } catch (error) {
      if (versao !== versaoOperacao.current) return;

      setErroFoto(
        error instanceof FotoInvalidaError
          ? error.message
          : "Não foi possível preparar esta foto. Escolha outra imagem e tente novamente.",
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
    setErroFoto("");
  }

  return {
    foto,
    erroFoto,
    preparandoFoto,
    escolherFoto,
    limparFoto,
  };
}

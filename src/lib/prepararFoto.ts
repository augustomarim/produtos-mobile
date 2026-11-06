import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { FotoProduto } from "@/types/foto";

export const TAMANHO_MAXIMO_FOTO = 4 * 1024 * 1024;
const DIMENSAO_MAXIMA = 1600;
export class FotoInvalidaError extends Error {}

type ImagemSelecionada = { uri: string; width: number; height: number };

function tamanhoBase64(base64: string) {
  const preenchimento = base64.endsWith("==")
    ? 2
    : base64.endsWith("=")
      ? 1
      : 0;
  return (base64.length * 3) / 4 - preenchimento;
}

// Converte apenas uma cópia no cache. A foto original da biblioteca não muda.
export async function prepararFoto(
  arquivo: ImagemSelecionada,
): Promise<FotoProduto> {
  const contexto = ImageManipulator.manipulate(arquivo.uri);
  try {
    if (arquivo.width > DIMENSAO_MAXIMA || arquivo.height > DIMENSAO_MAXIMA) {
      contexto.resize(
        arquivo.width >= arquivo.height
          ? { width: DIMENSAO_MAXIMA }
          : { height: DIMENSAO_MAXIMA },
      );
    }
    const imagem = await contexto.renderAsync();
    try {
      const preparada = await imagem.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.8,
        base64: true,
      });
      if (!preparada.base64)
        throw new FotoInvalidaError(
          "Não foi possível verificar o tamanho da foto.",
        );
      const tamanho = tamanhoBase64(preparada.base64);
      if (tamanho > TAMANHO_MAXIMO_FOTO)
        throw new FotoInvalidaError(
          "A foto preparada ainda ultrapassa 4 MB. Escolha outra imagem.",
        );
      return {
        uri: preparada.uri,
        name: `produto-${Date.now()}.jpg`,
        type: "image/jpeg",
        tamanho,
      };
    } finally {
      imagem.release();
    }
  } finally {
    contexto.release();
  }
}

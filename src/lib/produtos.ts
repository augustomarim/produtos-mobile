import type { DadosProdutoForm, Produto } from "@/types/produto";

type Requisicao = <T>(caminho: string, opcoes?: RequestInit) => Promise<T>;

export function montarFormularioProduto(dados: DadosProdutoForm) {
  const formulario = new FormData();
  formulario.append("codigo_produto", dados.codigo_produto.trim());
  formulario.append("descricao_produto", dados.descricao_produto.trim());
  if (dados.foto) {
    // O FormData nativo aceita { uri, name, type }; a definição DOM exige Blob.
    formulario.append("foto_produto", {
      uri: dados.foto.uri,
      name: dados.foto.name,
      type: dados.foto.type,
    } as unknown as Blob);
  }
  return formulario;
}

export async function criarProduto(
  dados: DadosProdutoForm,
  requisicao: Requisicao,
) {
  // O dono e o status inicial são definidos no backend. Não enviar usuarioId.
  // Deixe o fetch gerar Content-Type e boundary do multipart automaticamente.
  return requisicao<Produto>("/produtos", {
    method: "POST",
    body: montarFormularioProduto(dados),
  });
}

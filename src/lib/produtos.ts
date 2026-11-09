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

function idValido(id: number) {
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647)
    throw new Error("Produto inválido. Volte ao catálogo.");
  return id;
}
function idsValidos(ids: number[]) {
  if (!ids.length || ids.length > 100)
    throw new Error("Selecione entre 1 e 100 produtos.");
  ids.forEach(idValido);
  return [...new Set(ids)];
}
export function buscarProduto(
  id: number,
  requisicao: Requisicao,
  signal?: AbortSignal,
) {
  return requisicao<Produto>(`/produtos/${idValido(id)}`, { signal });
}
export function editarProduto(
  id: number,
  dados: DadosProdutoForm,
  requisicao: Requisicao,
) {
  return requisicao<Produto>(`/produtos/${idValido(id)}`, {
    method: "PUT",
    body: montarFormularioProduto(dados),
  });
}
export function removerFotoProduto(id: number, requisicao: Requisicao) {
  return requisicao<Produto>(`/produtos/${idValido(id)}/foto`, {
    method: "DELETE",
  });
}
export function alterarStatusProduto(id: number, requisicao: Requisicao) {
  return requisicao<Produto>(`/produtos/${idValido(id)}/status`, {
    method: "PATCH",
  });
}
export function excluirProduto(id: number, requisicao: Requisicao) {
  return requisicao<void>(`/produtos/${idValido(id)}`, { method: "DELETE" });
}
export function alterarStatusLote(
  ids: number[],
  status: Produto["status"],
  requisicao: Requisicao,
) {
  return requisicao<import("@/types/produto").ResultadoLote>(
    "/produtos/status",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: idsValidos(ids), status }),
    },
  );
}
export function excluirProdutosLote(ids: number[], requisicao: Requisicao) {
  return requisicao<import("@/types/produto").ResultadoLote>("/produtos", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: idsValidos(ids) }),
  });
}

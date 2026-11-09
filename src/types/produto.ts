import type { FotoProduto } from "./foto";

export type Produto = {
  id: number;
  codigo_produto: string;
  descricao_produto: string;
  status: "ativo" | "inativo";
  foto_produto: string | null;
  foto_miniatura: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
export type FiltroStatus = "todos" | "ativo" | "inativo";
export type PaginaProdutos = {
  produtos: Produto[];
  total: number;
  pagina: number;
  paginas: number;
  limite: number;
  resumo: { total: number; ativos: number; inativos: number };
};

export type DadosProdutoForm = {
  codigo_produto: string;
  descricao_produto: string;
  foto: FotoProduto | null;
};

export type ResultadoLote = {
  solicitados: number;
  afetados: number;
  jaNoStatus?: number;
  naoEncontrados?: number;
  produtos?: Produto[];
  idsExcluidos?: number[];
  fotosNaoRemovidas?: number;
};

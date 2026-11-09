import type { FiltroStatus, PaginaProdutos, Produto } from "@/types/produto";
export function restringirSelecao(
  ids: ReadonlySet<number>,
  produtos: Produto[],
) {
  const visiveis = new Set(produtos.map((p) => p.id));
  return new Set([...ids].filter((id) => visiveis.has(id)));
}
export function planejarStatus(
  produtos: Produto[],
  ids: ReadonlySet<number>,
  status: Produto["status"],
) {
  const selecionados = produtos.filter((p) => ids.has(p.id));
  return {
    ids: selecionados.filter((p) => p.status !== status).map((p) => p.id),
    jaNoStatus: selecionados.filter((p) => p.status === status).length,
  };
}
export function descreverExclusao(produtos: Produto[]) {
  const nomes = produtos
    .slice(0, 5)
    .map((p) => `• ${p.descricao_produto} (${p.codigo_produto})`)
    .join("\n");
  return `${nomes}${produtos.length > 5 ? `\n… e mais ${produtos.length - 5} produtos.` : ""}\n\nAs fotos também serão removidas. Essa ação não pode ser desfeita.`;
}
export function sincronizarPagina(
  pagina: PaginaProdutos,
  atualizados: Produto[],
  excluidos: number[],
  filtro: FiltroStatus,
): PaginaProdutos {
  const mapa = new Map(atualizados.map((p) => [p.id, p]));
  const removidos = new Set(excluidos);
  let ativos = pagina.resumo.ativos,
    inativos = pagina.resumo.inativos,
    total = pagina.total,
    totalGeral = pagina.resumo.total;
  const produtos: Produto[] = [];
  for (const antigo of pagina.produtos) {
    if (removidos.has(antigo.id)) {
      total--;
      totalGeral--;
      if (antigo.status === "ativo") ativos--;
      else inativos--;
      continue;
    }
    const novo = mapa.get(antigo.id) || antigo;
    if (novo.status !== antigo.status) {
      if (novo.status === "ativo") {
        ativos++;
        inativos--;
      } else {
        ativos--;
        inativos++;
      }
    }
    if (filtro !== "todos" && novo.status !== filtro) {
      total--;
      continue;
    }
    produtos.push(novo);
  }
  const data = (p: Produto) => (p.updatedAt ? Date.parse(p.updatedAt) || 0 : 0);
  produtos.sort((a, b) =>
    a.status !== b.status
      ? a.status === "ativo"
        ? -1
        : 1
      : data(b) - data(a) || b.id - a.id,
  );
  return {
    ...pagina,
    produtos,
    total: Math.max(0, total),
    resumo: {
      total: Math.max(0, totalGeral),
      ativos: Math.max(0, ativos),
      inativos: Math.max(0, inativos),
    },
  };
}

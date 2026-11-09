import { useEffect, useState } from "react";
import { restringirSelecao } from "@/lib/selecaoProdutos";
import type { Produto } from "@/types/produto";
export function useSelecaoProdutos(produtos: Produto[]) {
  const [ids, setIds] = useState<Set<number>>(new Set());
  const visiveis = restringirSelecao(ids, produtos);
  useEffect(() => {
    let ativo = true;
    void Promise.resolve().then(() => {
      if (ativo)
        setIds((atuais) => {
          const novos = restringirSelecao(atuais, produtos);
          return novos.size === atuais.size ? atuais : novos;
        });
    });
    return () => {
      ativo = false;
    };
  }, [produtos]);
  function marcar(id: number) {
    if (!produtos.some((p) => p.id === id)) return;
    setIds((atuais) => {
      const novos = restringirSelecao(atuais, produtos);
      if (novos.has(id)) novos.delete(id);
      else if (novos.size < 100) novos.add(id);
      return novos;
    });
  }
  function marcarTodos() {
    setIds(
      visiveis.size === produtos.length
        ? new Set()
        : new Set(produtos.slice(0, 100).map((p) => p.id)),
    );
  }
  return {
    ids: visiveis,
    marcar,
    marcarTodos,
    limpar: () => setIds(new Set()),
    todos: produtos.length > 0 && visiveis.size === produtos.length,
    parcial: visiveis.size > 0 && visiveis.size < produtos.length,
  };
}

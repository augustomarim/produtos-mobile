import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { SessaoAlteradaError, SessaoExpiradaError } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { confirmarAcao } from "@/lib/confirmacao";
import {
  alterarStatusProduto,
  excluirProduto,
  alterarStatusLote,
  excluirProdutosLote,
} from "@/lib/produtos";
import { descreverExclusao, planejarStatus } from "@/lib/selecaoProdutos";
import type { Produto } from "@/types/produto";
type Acao = "ativo" | "inativo" | "excluir";
type Alteracao = { atualizados?: Produto[]; excluidos?: number[] };
export function useAcoesProdutos(
  produtos: Produto[],
  ids: ReadonlySet<number>,
  limpar: () => void,
  sincronizar: (dados: Alteracao) => void,
) {
  const { requisicao } = useAuth();
  const avisar = useFeedback();
  const trava = useRef(false);
  const [pendente, setPendente] = useState<{
    id: number;
    acao: "status" | "excluir";
  } | null>(null);
  const [lote, setLote] = useState<Acao | null>(null);
  function falha(error: unknown) {
    if (
      error instanceof SessaoAlteradaError ||
      error instanceof SessaoExpiradaError
    )
      return;
    if (error instanceof ApiError && error.status === 404) sincronizar({});
    avisar(
      error instanceof Error
        ? error.message
        : "Não foi possível concluir a operação.",
      true,
    );
  }
  async function individual(produto: Produto, acao: "status" | "excluir") {
    if (trava.current) return;
    trava.current = true;
    try {
      if (
        acao === "excluir" &&
        !(await confirmarAcao(
          "Excluir produto?",
          descreverExclusao([produto]),
          "Excluir produto",
          true,
        ))
      )
        return;
      setPendente({ id: produto.id, acao });
      if (acao === "status") {
        const atualizado = await alterarStatusProduto(produto.id, requisicao);
        sincronizar({ atualizados: [atualizado] });
        avisar(
          `Produto ${atualizado.status === "ativo" ? "ativado" : "inativado"}.`,
        );
      } else {
        await excluirProduto(produto.id, requisicao);
        sincronizar({ excluidos: [produto.id] });
        avisar("Produto excluído.");
      }
      limpar();
    } catch (error) {
      falha(error);
    } finally {
      trava.current = false;
      setPendente(null);
    }
  }
  async function executarLote(acao: Acao) {
    if (trava.current || !ids.size) return;
    trava.current = true;
    const selecionados = produtos.filter((p) => ids.has(p.id));
    const plano =
      acao === "excluir" ? null : planejarStatus(produtos, ids, acao);
    const enviados = plano ? plano.ids : selecionados.map((p) => p.id);
    try {
      if (!enviados.length) return;
      if (
        acao === "excluir" &&
        !(await confirmarAcao(
          `Excluir ${enviados.length} produtos?`,
          descreverExclusao(selecionados),
          `Excluir ${enviados.length} produtos`,
          true,
        ))
      )
        return;
      setLote(acao);
      const resultado =
        acao === "excluir"
          ? await excluirProdutosLote(enviados, requisicao)
          : await alterarStatusLote(enviados, acao, requisicao);
      if (acao === "excluir") sincronizar({ excluidos: enviados });
      else {
        const existentes = new Set((resultado.produtos || []).map((p) => p.id));
        sincronizar({
          atualizados: resultado.produtos,
          excluidos: enviados.filter((id) => !existentes.has(id)),
        });
      }
      limpar();
      let texto = `${resultado.afetados} produto(s) ${acao === "excluir" ? "excluído(s)" : "alterado(s)"}.`;
      const jaEstavam = (plano?.jaNoStatus || 0) + (resultado.jaNoStatus || 0);
      if (jaEstavam) texto += ` ${jaEstavam} já estavam no status solicitado.`;
      if (resultado.afetados + (resultado.jaNoStatus || 0) < enviados.length)
        texto +=
          " Alguns produtos já não estavam disponíveis. A lista foi sincronizada.";
      if (resultado.fotosNaoRemovidas)
        texto += ` ${resultado.fotosNaoRemovidas} foto(s) não puderam ser removidas do armazenamento.`;
      avisar(texto, !!resultado.fotosNaoRemovidas);
    } catch (error) {
      falha(error);
    } finally {
      trava.current = false;
      setLote(null);
    }
  }
  return {
    pendente,
    lote,
    ocupado: !!pendente || !!lote,
    individual,
    executarLote,
  };
}

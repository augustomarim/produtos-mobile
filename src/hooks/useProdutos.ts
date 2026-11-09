import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { sincronizarPagina } from "@/lib/selecaoProdutos";
import type { Produto, FiltroStatus, PaginaProdutos } from "@/types/produto";

type Consulta = { pagina: number; busca: string; filtro: FiltroStatus };

export function useProdutos() {
  const { requisicao } = useAuth();
  const [resultado, setResultado] = useState<PaginaProdutos | null>(null);
  const [consulta, setConsulta] = useState<Consulta>({
    pagina: 1,
    busca: "",
    filtro: "todos",
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [revisao, setRevisao] = useState(0);
  const revisaoAtual = useRef(0);
  const requisicaoAtual = useRef<AbortController | null>(null);

  // Refaz a consulta ao voltar de outra tela e cancela pedidos ao perder foco.
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      const controller = new AbortController();
      requisicaoAtual.current = controller;
      const atraso = setTimeout(() => {
        setCarregando(true);
        setErro("");
        void requisicao<PaginaProdutos>(
          `/produtos?pagina=${consulta.pagina}&limite=20&ordem=atualizados&status=${consulta.filtro}&busca=${encodeURIComponent(consulta.busca.trim())}`,
          { signal: controller.signal },
        )
          .then((dados) => {
            if (
              !ativo ||
              controller.signal.aborted ||
              revisao !== revisaoAtual.current
            ) return;
            if (!dados || !Array.isArray(dados.produtos))
              throw new Error(
                "O servidor retornou uma lista de produtos inválida.",
              );
            setResultado(dados);
            if (dados.pagina !== consulta.pagina)
              setConsulta((atual) => ({ ...atual, pagina: dados.pagina }));
          })
          .catch((error: unknown) => {
            if (ativo && !controller.signal.aborted)
              setErro(
                error instanceof Error
                  ? error.message
                  : "Não foi possível carregar seus produtos.",
              );
          })
          .finally(() => {
            if (ativo && revisao === revisaoAtual.current) setCarregando(false);
          });
      }, 250);
      return () => {
        ativo = false;
        clearTimeout(atraso);
        controller.abort();
        if (requisicaoAtual.current === controller)
          requisicaoAtual.current = null;
      };
    }, [consulta, requisicao, revisao]),
  );

  const cancelar = useCallback(() => {
    requisicaoAtual.current?.abort();
  }, []);
  function alterarFiltros(busca: string, filtro: FiltroStatus) {
    setConsulta({ busca, filtro, pagina: 1 });
    setErro("");
    setCarregando(true);
    setResultado((anterior) =>
      anterior ? { ...anterior, produtos: [] } : null,
    );
  }
  function atualizar() {
    if (carregando) return;
    setErro("");
    setCarregando(true);
    // Uma revisão explícita refaz a consulta mesmo com critérios iguais.
    // Também impede que uma resposta anterior substitua a atualização local.
    revisaoAtual.current += 1;
    setRevisao(revisaoAtual.current);
  }
  function mudarPagina(pagina: number) {
    if (
      carregando ||
      !resultado ||
      pagina < 1 ||
      pagina > resultado.paginas ||
      pagina === consulta.pagina
    )
      return;
    setCarregando(true);
    setConsulta((atual) => ({ ...atual, pagina }));
  }
  function aplicarAlteracao({
    atualizados = [],
    excluidos = [],
  }: {
    atualizados?: Produto[];
    excluidos?: number[];
  }) {
    setResultado((anterior) =>
      anterior
        ? sincronizarPagina(anterior, atualizados, excluidos, consulta.filtro)
        : anterior,
    );
    setCarregando(true);
    setErro("");
    revisaoAtual.current += 1;
    setRevisao(revisaoAtual.current);
  }
  return {
    aplicarAlteracao,
    resultado,
    produtos: resultado?.produtos ?? [],
    carregando,
    erro,
    pagina: consulta.pagina,
    busca: consulta.busca,
    filtro: consulta.filtro,
    filtrando: !!consulta.busca.trim() || consulta.filtro !== "todos",
    alterarFiltros,
    atualizar,
    mudarPagina,
    cancelar,
  };
}

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { FiltroStatus, PaginaProdutos } from "@/types/produto";
export function useProdutos() {
  const { requisicao } = useAuth();
  const [resultado, setResultado] = useState<PaginaProdutos | null>(null);
  const [pagina, setPagina] = useState(1);
  const [tentativa, setTentativa] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todos");
  const requisicaoAtual = useRef<AbortController | null>(null);
  useEffect(() => {
    let ativo = true;
    const controller = new AbortController();
    requisicaoAtual.current = controller;
    const atraso = setTimeout(() => {
      setCarregando(true);
      setErro("");
      void requisicao<PaginaProdutos>(
        `/produtos?pagina=${pagina}&limite=20&ordem=atualizados&status=${filtro}&busca=${encodeURIComponent(busca.trim())}`,
        { signal: controller.signal },
      )
        .then((dados) => {
          if (!ativo || controller.signal.aborted) return;
          if (!dados || !Array.isArray(dados.produtos))
            throw new Error(
              "O servidor retornou uma lista de produtos inválida.",
            );
          setResultado(dados);
          if (dados.pagina !== pagina) setPagina(dados.pagina);
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
          if (ativo) setCarregando(false);
        });
    }, 250);
    return () => {
      ativo = false;
      clearTimeout(atraso);
      controller.abort();
      if (requisicaoAtual.current === controller)
        requisicaoAtual.current = null;
    };
  }, [pagina, tentativa, requisicao, busca, filtro]);
  const cancelar = useCallback(() => {
    requisicaoAtual.current?.abort();
  }, []);
  function alterarFiltros(novaBusca: string, novoFiltro: FiltroStatus) {
    setBusca(novaBusca);
    setFiltro(novoFiltro);
    setPagina(1);
    setErro("");
    setCarregando(true);
    setResultado((anterior) =>
      anterior ? { ...anterior, produtos: [] } : null,
    );
    setTentativa((v) => v + 1);
  }
  function atualizar() {
    if (carregando) return;
    setErro("");
    setCarregando(true);
    setTentativa((v) => v + 1);
  }
  function mudarPagina(nova: number) {
    if (
      carregando ||
      !resultado ||
      nova < 1 ||
      nova > resultado.paginas ||
      nova === pagina
    )
      return;
    setCarregando(true);
    setPagina(nova);
  }
  return {
    resultado,
    produtos: resultado?.produtos ?? [],
    carregando,
    erro,
    busca,
    filtro,
    filtrando: !!busca.trim() || filtro !== "todos",
    alterarFiltros,
    atualizar,
    mudarPagina,
    cancelar,
  };
}

import { useTemaProdutos } from "@/contexts/TemaContext";

const claro = {
  fundo: "#f5f7f9",
  superficie: "#ffffff",
  texto: "#182b3a",
  secundario: "#425868",
  discreto: "#607483",
  placeholder: "#83939e",
  borda: "#e5eaef",
  bordaControle: "#ccd7df",
  destaque: "#137c65",
  botao: "#137c65",
  destaqueSuave: "#eaf6ef",
  destaqueBorda: "#b6deca",
  neutro: "#f0f4f7",
  erro: "#a52b38",
  erroSuave: "#fff0f0",
  erroBorda: "#e7b9bf",
  alertaSuave: "#fff3df",
  alertaBorda: "#e5c68d",
};

type Cores = typeof claro;

const escuro: Cores = {
  fundo: "#121c25",
  superficie: "#1b2732",
  texto: "#eef4f8",
  secundario: "#bccbd6",
  discreto: "#a9bac8",
  placeholder: "#a0b2c0",
  borda: "#334453",
  bordaControle: "#465a6c",
  destaque: "#78dec2",
  botao: "#137c65",
  destaqueSuave: "#1d3c37",
  destaqueBorda: "#3c675b",
  neutro: "#23323f",
  erro: "#ffadb5",
  erroSuave: "#482930",
  erroBorda: "#77444f",
  alertaSuave: "#42341e",
  alertaBorda: "#7b6236",
};

export function useCoresProdutos(): Cores {
  return useTemaProdutos().tema === "dark" ? escuro : claro;
}

export function criarEstilosProdutos<T>(criar: (cores: Cores) => T) {
  const estilosClaros = criar(claro);
  const estilosEscuros = criar(escuro);

  return function useEstilosProdutos() {
    const cores = useCoresProdutos();
    return { cores, estilos: cores === escuro ? estilosEscuros : estilosClaros };
  };
}

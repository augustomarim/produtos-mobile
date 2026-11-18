import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useColorScheme } from "@/hooks/use-color-scheme";

type Tema = "dark" | "light";
const chave = "produtos-tema";
const ContextoTema = createContext<{ tema: Tema; alternar: () => void }>({
  tema: "light",
  alternar: () => {},
});

async function lerTema() {
  return Platform.OS === "web"
    ? globalThis.localStorage.getItem(chave)
    : SecureStore.getItemAsync(chave);
}

async function salvarTema(tema: Tema) {
  if (Platform.OS === "web") globalThis.localStorage.setItem(chave, tema);
  else await SecureStore.setItemAsync(chave, tema);
}

export function TemaProvider({ children }: { children: ReactNode }) {
  const sistema = useColorScheme();
  const [preferencia, setPreferencia] = useState<Tema | null>(null);
  const escolha = useRef<Tema | null>(null);
  const gravacao = useRef(Promise.resolve());
  const tema = preferencia ?? (sistema === "dark" ? "dark" : "light");

  useEffect(() => {
    let ativo = true;
    void lerTema().then((salvo) => {
      if (ativo && escolha.current === null && (salvo === "dark" || salvo === "light")) {
        escolha.current = salvo;
        setPreferencia(salvo);
      }
    }).catch(() => {});
    return () => { ativo = false; };
  }, []);

  function alternar() {
    const proximo = (escolha.current ?? tema) === "dark" ? "light" : "dark";
    escolha.current = proximo;
    setPreferencia(proximo);
    gravacao.current = gravacao.current.then(() => salvarTema(proximo)).catch(() => {});
  }

  return <ContextoTema.Provider value={{ tema, alternar }}>{children}</ContextoTema.Provider>;
}

export function useTemaProdutos() {
  return useContext(ContextoTema);
}

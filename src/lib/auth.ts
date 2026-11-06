import * as SecureStore from "expo-secure-store";
import { api, ApiError } from "./api";
const CHAVE_REFRESH = "produtos.refreshToken";
export type Usuario = { id: number; nome: string; email: string };
type Tokens = {
  token: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};
let accessToken: string | null = null;
let renovacao: Promise<string> | null = null;
let versaoSessao = 0;
let fila: Promise<void> = Promise.resolve();
export class SessaoExpiradaError extends Error {
  constructor() {
    super("Sua sessão expirou. Entre novamente.");
    this.name = "SessaoExpiradaError";
  }
}
export class SessaoAlteradaError extends Error {
  constructor() {
    super("A sessão mudou. A operação anterior foi interrompida.");
    this.name = "SessaoAlteradaError";
  }
}
function executarEmFila<T>(operacao: () => Promise<T>): Promise<T> {
  const tarefa = fila.then(operacao);
  fila = tarefa.then(
    () => undefined,
    () => undefined,
  );
  return tarefa;
}
async function guardarTokens(dados: Tokens) {
  if (
    !dados ||
    typeof dados.token !== "string" ||
    !dados.token ||
    typeof dados.refreshToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(dados.refreshToken)
  )
    throw new Error("O servidor retornou uma sessão inválida.");
  await SecureStore.setItemAsync(CHAVE_REFRESH, dados.refreshToken, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  accessToken = dados.token;
}
async function limparSessaoLocal() {
  await SecureStore.deleteItemAsync(CHAVE_REFRESH);
  accessToken = null;
  versaoSessao++;
}
export function entrar(email: string, senha: string): Promise<Usuario> {
  return executarEmFila(async () => {
    const dados = await api<Tokens & { usuario: Usuario }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), senha }),
    });
    if (
      !dados?.usuario ||
      !Number.isInteger(dados.usuario.id) ||
      dados.usuario.id <= 0
    )
      throw new Error("O servidor retornou um usuário inválido.");
    await guardarTokens(dados);
    versaoSessao++;
    return dados.usuario;
  });
}
function renovarAccessToken(tokenRejeitado?: string): Promise<string> {
  if (tokenRejeitado && accessToken && accessToken !== tokenRejeitado)
    return Promise.resolve(accessToken);
  if (renovacao) return renovacao;
  const tarefa = executarEmFila(async () => {
    if (tokenRejeitado && accessToken && accessToken !== tokenRejeitado)
      return accessToken;
    const refreshToken = await SecureStore.getItemAsync(CHAVE_REFRESH);
    if (!refreshToken) {
      accessToken = null;
      throw new SessaoExpiradaError();
    }
    let dados: Tokens;
    try {
      dados = await api<Tokens>("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await limparSessaoLocal();
        throw new SessaoExpiradaError();
      }
      throw error;
    }
    await guardarTokens(dados);
    return dados.token;
  });
  const pendente = tarefa.finally(() => {
    if (renovacao === pendente) renovacao = null;
  });
  renovacao = pendente;
  return pendente;
}
async function obterAccessToken() {
  return accessToken || renovarAccessToken();
}
export async function restaurarSessao(): Promise<boolean> {
  try {
    await obterAccessToken();
    return true;
  } catch (error) {
    if (error instanceof SessaoExpiradaError) return false;
    throw error;
  }
}
export async function apiAutenticada<T>(
  caminho: string,
  opcoes: RequestInit = {},
): Promise<T> {
  const versao = versaoSessao;
  const verificar = () => {
    if (versao !== versaoSessao) throw new SessaoAlteradaError();
  };
  let token = await obterAccessToken();
  verificar();
  try {
    const resultado = await api<T>(caminho, opcoes, token);
    verificar();
    return resultado;
  } catch (error) {
    verificar();
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }
  token = await renovarAccessToken(token);
  verificar();
  try {
    const resultado = await api<T>(caminho, opcoes, token);
    verificar();
    return resultado;
  } catch (error) {
    verificar();
    if (error instanceof ApiError && error.status === 401) {
      await executarEmFila(async () => {
        verificar();
        await limparSessaoLocal();
      });
      throw new SessaoExpiradaError();
    }
    throw error;
  }
}
export function sair(): Promise<boolean> {
  return executarEmFila(async () => {
    const refreshToken = await SecureStore.getItemAsync(CHAVE_REFRESH);
    await limparSessaoLocal();
    if (!refreshToken) return true;
    try {
      await api<void>("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
      return true;
    } catch {
      return false;
    }
  });
}

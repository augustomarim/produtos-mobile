const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
type DetalheErro = { field: string; message: string };
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: DetalheErro[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export async function api<T>(
  caminho: string,
  opcoes: RequestInit = {},
  token?: string,
): Promise<T> {
  if (!API_URL)
    throw new Error("Configure EXPO_PUBLIC_API_URL no .env e reinicie o Expo.");
  const headers = new Headers(opcoes.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (typeof opcoes.body === "string" && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const controller = new AbortController();
  const cancelar = () => controller.abort();
  const timeout = setTimeout(cancelar, 60_000);
  if (opcoes.signal?.aborted) cancelar();
  else opcoes.signal?.addEventListener("abort", cancelar);
  try {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      headers,
      signal: controller.signal,
    });
    if (resposta.status === 204) return undefined as T;
    const dados = await resposta.json().catch(() => null);
    if (!resposta.ok)
      throw new ApiError(
        dados?.error || "Não foi possível concluir a operação.",
        resposta.status,
        Array.isArray(dados?.details) ? dados.details : [],
      );
    return dados as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted)
      throw new Error(
        opcoes.signal?.aborted
          ? "Requisição cancelada."
          : "O servidor demorou para responder. Tente novamente.",
      );
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão.",
    );
  } finally {
    clearTimeout(timeout);
    opcoes.signal?.removeEventListener("abort", cancelar);
  }
}

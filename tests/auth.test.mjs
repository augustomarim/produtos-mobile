import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Exercise the production session code, with only HTTP and native storage replaced.
const source = await readFile(
  new URL("../src/lib/auth.ts", import.meta.url),
  "utf8",
);
let sequence = 0;
async function setup() {
  const id = `mobileAuthTest${++sequence}`;
  const memory = new Map();
  const calls = [];
  const state = {
    memory,
    calls,
    async api(path, options, token) {
      calls.push({ path, options, token });
      return path === "/auth/logout"
        ? undefined
        : {
            token: `access-${calls.length}`,
            refreshToken: String(calls.length).padStart(64, "0"),
            refreshTokenExpiresAt: "2099-01-01T00:00:00Z",
            usuario: { id: 1, nome: "Teste", email: "a@example.test" },
          };
    },
  };
  globalThis[id] = state;
  const bridge = `const state=globalThis[${JSON.stringify(id)}];
    export const WHEN_UNLOCKED_THIS_DEVICE_ONLY=1;
    export async function getItemAsync(key){return state.memory.get(key)??null;}
    export async function setItemAsync(key,value){state.memory.set(key,value);}
    export async function deleteItemAsync(key){state.memory.delete(key);}
    export class ApiError extends Error{constructor(message,status){super(message);this.status=status;}}
    export function api(...args){return state.api(...args);}`;
  const bridgeUrl =
    "data:text/javascript;base64," + Buffer.from(bridge).toString("base64");
  const js = ts
    .transpile(source, {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    })
    .replaceAll("'expo-secure-store'", JSON.stringify(bridgeUrl))
    .replaceAll("'./api'", JSON.stringify(bridgeUrl))
    .replaceAll('"expo-secure-store"', JSON.stringify(bridgeUrl))
    .replaceAll('"./api"', JSON.stringify(bridgeUrl));
  const m = await import(
    "data:text/javascript;base64," +
      Buffer.from(js + "\n// " + id).toString("base64")
  );
  const { ApiError } = await import(bridgeUrl);
  return { m, state, ApiError, cleanup: () => delete globalThis[id] };
}
const KEY = "produtos.refreshToken";
test("login guarda só refresh token e pedidos reutilizam access token em memória", async () => {
  const h = await setup();
  try {
    await h.m.entrar(" a@example.test ", "senha");
    assert.equal(h.state.memory.size, 1);
    assert.match(h.state.memory.get(KEY), /^[0-9]{64}$/);
    assert.deepEqual(JSON.parse(h.state.calls[0].options.body), {
      email: "a@example.test",
      senha: "senha",
    });
    await h.m.apiAutenticada("/produtos");
    assert.equal(h.state.calls[1].token, "access-1");
    assert.equal(h.state.calls.length, 2);
  } finally {
    h.cleanup();
  }
});
test("restauração simultânea compartilha uma renovação e salva o refresh rotacionado", async () => {
  const h = await setup();
  try {
    h.state.memory.set(KEY, "a".repeat(64));
    assert.deepEqual(
      await Promise.all([
        h.m.restaurarSessao(),
        h.m.restaurarSessao(),
        h.m.restaurarSessao(),
      ]),
      [true, true, true],
    );
    assert.equal(h.state.calls.length, 1);
    assert.notEqual(h.state.memory.get(KEY), "a".repeat(64));
  } finally {
    h.cleanup();
  }
});
test("falha de conexão preserva sessão; refresh rejeitado remove credencial", async () => {
  const h = await setup();
  try {
    h.state.memory.set(KEY, "a".repeat(64));
    h.state.api = async () => {
      throw new Error("Sem rede");
    };
    await assert.rejects(h.m.restaurarSessao(), /Sem rede/);
    assert.equal(h.state.memory.get(KEY), "a".repeat(64));
    h.state.api = async () => {
      throw new h.ApiError("Expirado", 401);
    };
    assert.equal(await h.m.restaurarSessao(), false);
    assert.equal(h.state.memory.size, 0);
  } finally {
    h.cleanup();
  }
});
test("401 renova uma vez; falha desconhecida de escrita não é repetida", async () => {
  const h = await setup();
  try {
    await h.m.entrar("a@example.test", "senha");
    let pedidos = 0,
      refreshes = 0;
    h.state.api = async (path) => {
      if (path === "/auth/refresh") {
        refreshes++;
        return { token: "novo", refreshToken: "b".repeat(64) };
      }
      pedidos++;
      if (pedidos === 1) throw new h.ApiError("Expirado", 401);
      return { ok: true };
    };
    assert.deepEqual(await h.m.apiAutenticada("/produtos"), { ok: true });
    assert.equal(pedidos, 2);
    assert.equal(refreshes, 1);
    let writes = 0;
    h.state.api = async () => {
      writes++;
      throw new Error("Sem rede");
    };
    await assert.rejects(
      h.m.apiAutenticada("/produtos", { method: "POST" }),
      /Sem rede/,
    );
    assert.equal(writes, 1);
  } finally {
    h.cleanup();
  }
});
test("resposta antiga da conta A é descartada depois de entrar na conta B", async () => {
  const h = await setup();
  try {
    await h.m.entrar("a@example.test", "senha");
    let release, started;
    const sent = new Promise((resolve) => {
      started = resolve;
    });
    const original = h.state.api;
    h.state.api = async (path, ...args) =>
      path === "/produtos"
        ? new Promise((resolve) => {
            release = () => resolve({ privado: "A" });
            started();
          })
        : original(path, ...args);
    const pending = h.m.apiAutenticada("/produtos");
    await sent;
    await h.m.entrar("b@example.test", "senha");
    release();
    await assert.rejects(pending, h.m.SessaoAlteradaError);
  } finally {
    h.cleanup();
  }
});
test("logout offline apaga credencial local e informa que revogação não foi confirmada", async () => {
  const h = await setup();
  try {
    await h.m.entrar("a@example.test", "senha");
    h.state.api = async () => {
      throw new Error("Sem rede");
    };
    assert.equal(await h.m.sair(), false);
    assert.equal(h.state.memory.size, 0);
    assert.equal(await h.m.restaurarSessao(), false);
  } finally {
    h.cleanup();
  }
});

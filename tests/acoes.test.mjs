import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
async function importar(path) {
  const code = ts.transpile(
    await readFile(new URL(path, import.meta.url), "utf8"),
    { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  );
  return import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  );
}
const s = await importar("../src/lib/selecaoProdutos.ts");
const api = await importar("../src/lib/produtos.ts");
const produtos = [
  { id: 1, status: "ativo", updatedAt: "2026-11-01T00:00:00Z" },
  { id: 2, status: "inativo", updatedAt: "2026-11-04T00:00:00Z" },
  { id: 3, status: "ativo", updatedAt: null },
];
const pagina = {
  produtos,
  total: 3,
  pagina: 1,
  paginas: 1,
  limite: 20,
  resumo: { total: 3, ativos: 2, inativos: 1 },
};
test("seleção de outra página é descartada e lote misto ignora quem já tem o status", () => {
  assert.deepEqual(
    [...s.restringirSelecao(new Set([1, 2, 100]), produtos)],
    [1, 2],
  );
  assert.deepEqual(s.planejarStatus(produtos, new Set([1, 2]), "ativo"), {
    ids: [2],
    jaNoStatus: 1,
  });
  assert.deepEqual(s.planejarStatus(produtos, new Set([1, 3]), "ativo"), {
    ids: [],
    jaNoStatus: 2,
  });
});
test("inativar mantém ativos antes dos inativos, respeita datas e não modifica origem", () => {
  const resultado = s.sincronizarPagina(
    pagina,
    [{ ...produtos[0], status: "inativo", updatedAt: "2026-11-09T00:00:00Z" }],
    [],
    "todos",
  );
  assert.deepEqual(
    resultado.produtos.map((p) => p.id),
    [3, 1, 2],
  );
  assert.deepEqual(resultado.resumo, { total: 3, ativos: 1, inativos: 2 });
  assert.equal(produtos[0].status, "ativo");
});
test("mudança de status remove item do filtro e exclusão atualiza contagens", () => {
  const ativos = { ...pagina, produtos: [produtos[0], produtos[2]], total: 2 };
  const resultado = s.sincronizarPagina(
    ativos,
    [{ ...produtos[0], status: "inativo" }],
    [3],
    "ativo",
  );
  assert.deepEqual(resultado.produtos, []);
  assert.equal(resultado.total, 0);
  assert.deepEqual(resultado.resumo, { total: 2, ativos: 0, inativos: 2 });
});
test("serviços recusam IDs inválidos e mais de 100 itens antes de acessar API", () => {
  let chamadas = 0;
  const req = () => {
    chamadas++;
  };
  for (const id of [0, -1, 1.5, NaN, 2147483648])
    assert.throws(() => api.buscarProduto(id, req));
  for (const ids of [[], Array.from({ length: 101 }, (_, i) => i + 1), [1, -1]])
    assert.throws(() => api.excluirProdutosLote(ids, req));
  assert.equal(chamadas, 0);
});
test("lote usa os contratos JSON corretos e deduplica IDs", async () => {
  const chamadas = [];
  const req = async (path, options) => {
    chamadas.push({ path, ...options });
    return { afetados: 2 };
  };
  await api.alterarStatusLote([2, 2, 3], "inativo", req);
  await api.excluirProdutosLote([2, 3], req);
  assert.equal(chamadas[0].path, "/produtos/status");
  assert.equal(chamadas[0].method, "PATCH");
  assert.deepEqual(JSON.parse(chamadas[0].body), {
    ids: [2, 3],
    status: "inativo",
  });
  assert.equal(chamadas[1].method, "DELETE");
  assert.deepEqual(JSON.parse(chamadas[1].body), { ids: [2, 3] });
});
test("edição omite autoria e status, preserva foto quando nenhuma nova é escolhida", async () => {
  let chamada;
  await api.editarProduto(
    3,
    {
      codigo_produto: " A ",
      descricao_produto: " B ",
      foto: null,
      usuarioId: 100,
      status: "ativo",
    },
    async (path, options) => {
      chamada = { path, ...options };
    },
  );
  assert.equal(chamada.path, "/produtos/3");
  assert.equal(chamada.method, "PUT");
  assert.equal(chamada.headers, undefined);
  assert.deepEqual(
    [...chamada.body.entries()],
    [
      ["codigo_produto", "A"],
      ["descricao_produto", "B"],
    ],
  );
});
test("operações não repetem falha de exclusão e propagam erro original", async () => {
  let chamadas = 0;
  const erro = new Error("Sem acesso");
  await assert.rejects(
    api.excluirProdutosLote([2, 3], async () => {
      chamadas++;
      throw erro;
    }),
    (e) => e === erro,
  );
  assert.equal(chamadas, 1);
});

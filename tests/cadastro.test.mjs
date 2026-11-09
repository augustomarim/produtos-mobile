import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
  new URL("../src/lib/produtos.ts", import.meta.url),
  "utf8",
);
const js = ts.transpile(source, {
  module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022,
});
const m = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
// Espelha o contrato do FormData nativo, que aceita descritores de arquivo.
class NativeFormData {
  values = [];
  append(...args) {
    this.values.push(args);
  }
}
test("cadastro monta multipart sem definir boundary nem aceitar autoria do cliente", async () => {
  const original = globalThis.FormData;
  globalThis.FormData = NativeFormData;
  try {
    let request;
    const salvo = {
      id: 5,
      codigo_produto: "AG-1",
      descricao_produto: "Água",
      status: "ativo",
    };
    const result = await m.criarProduto(
      {
        codigo_produto: " AG-1 ",
        descricao_produto: " Água ",
        foto: null,
        usuarioId: 99,
        status: "inativo",
      },
      async (path, options) => {
        request = { path, options };
        return salvo;
      },
    );
    assert.equal(result, salvo);
    assert.equal(request.path, "/produtos");
    assert.equal(request.options.method, "POST");
    assert.equal(request.options.headers, undefined);
    assert.deepEqual(request.options.body.values, [
      ["codigo_produto", "AG-1"],
      ["descricao_produto", "Água"],
    ]);
  } finally {
    globalThis.FormData = original;
  }
});
test("foto usa o nome de campo esperado pelo Multer e só os dados do arquivo", async () => {
  const original = globalThis.FormData;
  globalThis.FormData = NativeFormData;
  try {
    const photo = {
      uri: "file:///cache/foto.jpg",
      name: "foto.jpg",
      type: "image/jpeg",
      tamanho: 4000,
    };
    const form = m.montarFormularioProduto({
      codigo_produto: "FOTO",
      descricao_produto: "Produto com foto",
      foto: photo,
    });
    assert.deepEqual(form.values[2], [
      "foto_produto",
      { uri: photo.uri, name: photo.name, type: photo.type },
    ]);
    assert.equal(form.values.length, 3);
  } finally {
    globalThis.FormData = original;
  }
});
test("erro da API chega intacto ao formulário e POST não é repetido pelo serviço", async () => {
  const original = globalThis.FormData;
  globalThis.FormData = NativeFormData;
  try {
    for (const status of [409, 413, 500]) {
      const failure = Object.assign(new Error("Falha de teste"), { status });
      let calls = 0;
      await assert.rejects(
        m.criarProduto(
          { codigo_produto: "AG-1", descricao_produto: "Água", foto: null },
          async () => {
            calls++;
            throw failure;
          },
        ),
        (error) => error === failure,
      );
      assert.equal(calls, 1);
    }
  } finally {
    globalThis.FormData = original;
  }
});

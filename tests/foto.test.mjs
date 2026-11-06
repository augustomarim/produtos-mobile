import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const source = await readFile(
  new URL("../src/lib/prepararFoto.ts", import.meta.url),
  "utf8",
);
let sequence = 0;
async function setup(options = {}) {
  const id = `fotoNativeTest${++sequence}`;
  const state = {
    resize: [],
    inputs: [],
    saves: [],
    contextReleased: 0,
    imageReleased: 0,
    ...options,
  };
  globalThis[id] = state;
  const code = `const state = globalThis[${JSON.stringify(id)}];
    export const SaveFormat = {JPEG:'jpeg'};
    export const ImageManipulator = {manipulate(uri) {
      state.inputs.push(uri);
      return {
        resize(value) {state.resize.push(value);},
        async renderAsync() {
          if(state.failRender)throw new Error('Native render failed');
          return {
            async saveAsync(options) {
              state.saves.push(options);
              if(state.failSave)throw new Error('Native save failed');
              return {uri:'file:///cache/preparada.jpg',base64:state.base64 ?? 'YQ=='};
            },
            release(){state.imageReleased++;}
          };
        },
        release(){state.contextReleased++;}
      };
    }};`;
  const bridge =
    "data:text/javascript;base64," + Buffer.from(code).toString("base64");
  const js = ts
    .transpile(source, {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    })
    .replaceAll('"expo-image-manipulator"', JSON.stringify(bridge))
    .replaceAll("'expo-image-manipulator'", JSON.stringify(bridge));
  const m = await import(
    "data:text/javascript;base64," +
      Buffer.from(js + "\n// " + id).toString("base64")
  );
  return { m, state, cleanup: () => delete globalThis[id] };
}
const landscape = {
  uri: "file:///library/original.heic",
  width: 4032,
  height: 3024,
};
test("foto HEIC usa conversão JPEG, reduz lado maior e retorna só metadados de upload", async () => {
  const h = await setup();
  try {
    const result = await h.m.prepararFoto(landscape);
    assert.deepEqual(h.state.inputs, [landscape.uri]);
    assert.deepEqual(h.state.resize, [{ width: 1600 }]);
    assert.deepEqual(h.state.saves, [
      { format: "jpeg", compress: 0.8, base64: true },
    ]);
    assert.equal(result.type, "image/jpeg");
    assert.match(result.name, /^produto-\d+\.jpg$/);
    assert.equal(result.uri, "file:///cache/preparada.jpg");
    assert.equal(result.tamanho, 1);
    assert.equal("base64" in result, false);
    assert.equal(h.state.contextReleased, 1);
    assert.equal(h.state.imageReleased, 1);
  } finally {
    h.cleanup();
  }
});
test("foto vertical reduz altura; fotos pequenas não são ampliadas", async () => {
  for (const [file, resize] of [
    [{ ...landscape, width: 3024, height: 4032 }, [{ height: 1600 }]],
    [{ ...landscape, width: 640, height: 480 }, []],
  ]) {
    const h = await setup();
    try {
      await h.m.prepararFoto(file);
      assert.deepEqual(h.state.resize, resize);
    } finally {
      h.cleanup();
    }
  }
});
test("limite de 4 MB é aplicado aos bytes convertidos, inclusive no tamanho exato", async () => {
  const limit = 4 * 1024 * 1024;
  for (const size of [limit, limit + 1]) {
    const h = await setup({ base64: Buffer.alloc(size).toString("base64") });
    try {
      if (size === limit)
        assert.equal((await h.m.prepararFoto(landscape)).tamanho, limit);
      else await assert.rejects(h.m.prepararFoto(landscape), /ultrapassa 4 MB/);
      assert.equal(h.state.contextReleased, 1);
      assert.equal(h.state.imageReleased, 1);
    } finally {
      h.cleanup();
    }
  }
});
test("não libera foto para upload sem conseguir verificar seu tamanho", async () => {
  const h = await setup({ base64: "" });
  try {
    await assert.rejects(h.m.prepararFoto(landscape), /verificar o tamanho/);
    assert.equal(h.state.contextReleased, 1);
    assert.equal(h.state.imageReleased, 1);
  } finally {
    h.cleanup();
  }
});
test("falha ao renderizar libera o contexto nativo", async () => {
  const h = await setup({ failRender: true });
  try {
    await assert.rejects(h.m.prepararFoto(landscape), /render failed/);
    assert.equal(h.state.contextReleased, 1);
    assert.equal(h.state.imageReleased, 0);
  } finally {
    h.cleanup();
  }
});
test("falha ao salvar libera imagem e contexto nativos", async () => {
  const h = await setup({ failSave: true });
  try {
    await assert.rejects(h.m.prepararFoto(landscape), /save failed/);
    assert.equal(h.state.contextReleased, 1);
    assert.equal(h.state.imageReleased, 1);
  } finally {
    h.cleanup();
  }
});

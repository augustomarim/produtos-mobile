# Produtos Mobile

Aplicativo de estudo em React Native, Expo SDK 58 e TypeScript. Reutiliza o
backend Node/Prisma publicado no Render. Cada conta acessa somente seus próprios
produtos; login e cadastro usam as mesmas contas do site Next.js.

## Rodar no iPhone

Requer Node.js 24, npm e Expo Go compatível com o SDK 58.

```bash
npm ci
```

Copie `.env.example` para `.env`:

```env
EXPO_PUBLIC_API_URL=https://produtos-backend-klns.onrender.com
```

Essa URL é pública e incorporada ao bundle. Não coloque senha, segredo JWT,
DATABASE_URL ou credenciais do Cloudinary no aplicativo.

```bash
npx expo start --clear
```

Computador e iPhone devem estar na mesma rede. Entre na mesma conta Expo no CLI
e no Expo Go e leia o QR Code. Se o login do CLI por navegador falhar no Windows
e você possuir senha da Expo, use `npx expo login --no-browser`. A conta do
catálogo dentro do app é diferente da conta Expo/GitHub.

## Funcionalidades

- Cadastro de conta, login, restauração da sessão e logout com confirmação.
- Catálogo privado com busca, filtros, contagens e paginação de 20 produtos.
- Produtos ativos primeiro; dentro de cada status, alterações mais recentes.
- Criar e editar com validação, erros junto aos campos e preservação dos dados
  quando uma requisição falha. Novos cadastros começam com campos vazios.
- Escolher, preparar, pré-visualizar e enviar imagem; ampliar miniaturas;
  substituir ou remover a foto existente com confirmação.
- Ativar/inativar e excluir individualmente; seleção por produto ou página
  para ativar/inativar/excluir em lote, com confirmação antes de excluir.
- Botões de lote desabilitados quando todos já estão no status solicitado.
  Seleções mistas enviam somente os IDs que precisam mudar; falhas preservam
  a seleção e avisam o usuário. Seleção limitada à página visível.
- Confirmação ao descartar formulários, proteção durante envios e avisos de
  sucesso/falha. Aba Conta substitui a demonstração Explorar.

Criar um produto abre a primeira página sem filtros para exibi-lo. Editar volta
à lista mantendo os critérios anteriores e refaz a consulta ao ganhar foco.
Mudanças de status/exclusões atualizam imediatamente a lista e depois conferem
a paginação e as contagens no servidor. Atualizações têm uma revisão explícita
para funcionar mesmo quando busca, filtro e página continuam iguais.

Remover a foto existente é uma operação imediata da API, informada no formulário.
As demais alterações digitadas permanecem no formulário e só são enviadas ao
salvar. Cancelar depois disso não recupera a foto já removida.

## Organização

| Local | Responsabilidade |
| --- | --- |
| `src/app/_layout.tsx` | Sessão, avisos e rotas protegidas |
| `src/app/login.tsx`, `cadastro.tsx` | Acesso e criação de conta |
| `src/app/(app)/` | Abas Produtos e Conta |
| `src/app/produtos/novo.tsx` | Criar produto, fora das abas |
| `src/app/produtos/[id]/editar.tsx` | Carregar e editar um produto |
| `src/components/produtos/` | Formulário, cartões, imagens, filtros, ações e paginação |
| `src/hooks/useProdutos.ts` | Consulta, cancelamento, busca e atualização |
| `src/hooks/useSelecaoProdutos.ts`, `useAcoesProdutos.ts` | Seleção e operações individuais/em lote |
| `src/hooks/useProtecaoFormulario.ts` | Confirmação de descarte e bloqueio durante envio |
| `src/contexts/AuthContext.tsx` | Estado da autenticação |
| `src/contexts/FeedbackContext.tsx` | Avisos de resultado |
| `src/lib/auth.ts`, `api.ts`, `produtos.ts` | Sessão, HTTP e contratos da API |
| `src/lib/prepararFoto.ts` | Conversão e limite das imagens |
| `src/lib/selecaoProdutos.ts` | Plano de lote e atualização local da ordenação |

O access token fica em memória; somente o refresh token vai para SecureStore.
Pedidos simultâneos compartilham a renovação. Uma rejeição 401 permite renovar
e repetir uma vez; falhas desconhecidas de escrita não são repetidas. Falha de
conexão preserva a credencial e oferece nova tentativa. Logout apaga a sessão
local e avisa caso não consiga confirmar a revogação no servidor.

A foto é convertida para JPEG no cache, com lado maior até 1600 pixels,
compressão 0,8 e limite de 4 MB verificado após a conversão. A imagem original
é preservada. HEIC depende da decodificação do sistema. O formulário envia o
descritor nativo de arquivo em multipart; o fetch define o boundary. Não envia
usuarioId: a API obtém o dono pelo JWT. Não há acesso direto ao banco pelo app.

## Verificar

```bash
npm run typecheck
npm run lint
npm test
npm run export:ios
```

Os 22 testes de lógica verificam sessão, preparação de imagens, multipart,
limites de IDs, seleção, ordenação e contratos de edição/lote. Usam adaptadores
simulados e não acessam Render, Neon, Cloudinary ou o chaveiro real do iPhone.

Também foram conferidos em Chromium com API fictícia: cadastro de conta,
erros de validação/duplicidade, edição e descarte, remoção/ampliação de foto,
ordenação após mudar status, seleção mista, falha em lote, exclusões,
logout, rotas protegidas e regressões de cadastro/busca/filtros. Essa conferência
não usa contas ou registros publicados e não substitui testar o iPhone.

Os tipos de rotas em `.expo/` e `expo-env.d.ts` são gerados pelo Expo e ignorados
no Git. `src/types/expo.d.ts` permite verificar TypeScript antes de iniciar o
servidor em uma cópia nova.

Exportar o bundle iOS não gera um IPA nem publica o aplicativo. A versão de
navegador serve como apoio para testar fluxos; o envio de fotos usa FormData
nativo e deve ser conferido no iPhone.

### Conferir no aparelho antes da entrega

1. Cadastrar conta, entrar, fechar/reabrir o app e confirmar a restauração.
2. Criar dois produtos seguidos, com/sem foto, incluindo HEIC quando disponível.
3. Editar os campos e trocar/remover foto; conferir o resultado no site na mesma conta.
4. Cancelar um formulário alterado e testar as duas respostas da confirmação.
5. Ativar/inativar e conferir ordenação, filtro e datas após cada operação.
6. Selecionar produtos ativos, inativos e misturados; conferir botões e resultados.
7. Cancelar e confirmar exclusão; testar conexão indisponível e nova tentativa.
8. Sair e entrar com outra conta: o catálogo anterior não deve aparecer.
9. Conferir teclado, áreas seguras, tamanho de texto e galeria no iPhone.

## Build com EAS (preparado, sem publicação)

`eas.json` oferece `preview` para distribuição interna e `production` para build
de loja. Ambos usam a URL pública do Render. Os identificadores iniciais são
`com.augustomarim.produtos` em iOS e Android; confirme-os antes do primeiro build.
Não há projectId, conta Expo vinculada nem credenciais de assinatura no repositório.

Quando for preparar o build, já conectado à sua conta Expo:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform ios --profile preview
```

A distribuição interna para iPhone exige conta Apple Developer e registro do
aparelho para assinatura ad hoc. Para continuar estudando pelo Expo Go, esses
passos e a conta Apple paga não são necessários. TestFlight/App Store são uma
etapa posterior, com build `production` e envio separado. Nenhum build ou envio
à loja é executado pelos scripts de verificação acima.

## Baixar a atualização

No GitHub Desktop, salve suas alterações locais em commit, use **Fetch origin**
e selecione `codex/funcionalidades-mobile` para revisar. Depois da integração na
main, volte à main e use **Pull origin**.

```bash
npm ci
npx expo start --clear
```

O `.env` local permanece ignorado. Esta etapa não exige migração, mudança no
backend, Render ou Vercel.

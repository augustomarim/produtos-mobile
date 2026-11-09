# Produtos Mobile

Aplicativo de estudo em React Native, Expo SDK 58 e TypeScript. Usa a mesma
API do web; cada conta acessa somente seus próprios produtos.

## Rodar no iPhone

Requer Node.js 24, npm e Expo Go compatível com o SDK 58. Instale e configure:

```bash
npm ci
```

Copie `.env.example` para `.env` e mantenha a URL pública do Render:

```env
EXPO_PUBLIC_API_URL=https://produtos-backend-klns.onrender.com
```

Não coloque senhas, segredo JWT ou DATABASE_URL no app. A variável pública
é incorporada ao bundle. Reinicie o Expo ao modificá-la.

```bash
npx expo start --clear
```

Computador e iPhone devem estar na mesma rede. Entre na mesma conta Expo no
CLI e no Expo Go. Se o login por navegador falhar no Windows e você possuir
senha da Expo, use `npx expo login --no-browser`. O login dentro do aplicativo
usa a conta do catálogo (a mesma do site), não a conta Expo/GitHub.

## Organização

- `src/app/_layout.tsx`: sessão e rotas protegidas.
- `src/app/login.tsx`: tela de login e restauração da sessão.
- `src/app/(app)/_layout.tsx`: abas da área autenticada.
- `src/app/(app)/index.tsx`: composição da tela de listagem.
- `src/app/produtos/novo.tsx`: cadastro no Stack autenticado, acima das abas.
- `src/components/produtos/`: cartões, filtros, resumo, paginação e estado vazio.
- `src/hooks/useProdutos.ts`: consultas, busca, debounce, cancelamento e paginação.
- `src/hooks/useSaidaConta.ts`: confirmação e andamento do logout.
- `src/contexts/AuthContext.tsx`: estado compartilhado da autenticação.
- `src/lib/api.ts`: comunicação HTTP, erros e timeout.
- `src/lib/produtos.ts`: envio multipart do cadastro autenticado.
- `src/lib/auth.ts`: login, refresh, SecureStore e logout.
- `src/lib/datas.ts` e `src/types/produto.ts`: formatação e tipos compartilhados.

A listagem oferece fotos, datas, status, busca sem distinguir acentos, filtros,
paginação de 20 produtos e atualização ao arrastar. A ordenação e as contagens
são calculadas no backend e limitadas à conta autenticada. Alterar a busca
retorna à primeira página e cancela pedidos antigos.

O access token fica em memória. Somente o refresh token é salvo no SecureStore.
Pedidos simultâneos compartilham a renovação; login/refresh/logout são
serializados. Uma rejeição 401 permite uma renovação e uma única repetição.
Falhas de rede em escritas não são repetidas automaticamente. Uma falha ao
restaurar a sessão oferece nova tentativa e preserva a credencial. Logout
remove a sessão local; se não confirmar a revogação no servidor, avisa isso.

A aba Explorar ainda é a demonstração do template, agora dentro da área
protegida. Cadastro com foto já está disponível. Edição e ações em produtos serão
implementadas nas próximas etapas; não há telas vazias simulando essas funcionalidades.

## Verificar

```bash
npm run typecheck
npm run lint
npm test
npm run export:ios
```

O Expo gera `expo-env.d.ts` e tipos de rotas localmente, ignorados no Git.
`src/types/expo.d.ts` inclui os tipos globais do SDK também em cópias novas,
permitindo verificar o TypeScript antes de iniciar o servidor.
Os testes usam HTTP e armazenamento simulados; não acessam contas reais,
Render, Neon ou o chaveiro do iPhone. Exportar o bundle iOS não é compilar ou
publicar um IPA. O uso real de teclado, fotos e SecureStore deve ser conferido
no aparelho. Nenhum build EAS ou publicação é feito por estes comandos.

## Baixar esta organização sem perder alterações locais

Antes de trocar de branch no GitHub Desktop, faça commit dos seus arquivos
locais (sem `.env`). Depois use **Fetch origin** e selecione
`codex/cadastro-produto`. Se o Desktop avisar sobre alterações locais ao trocar,
mantenha-as na branch original; não sobrescreva arquivos à força.

Esta atualização parte da main com autenticação, listagem e preparação de
fotos já integradas. Se houver modificações locais adicionais, compare-as
antes de integrar.
Após trocar, rode `npm ci` e `npx expo start --clear`. O `.env` local permanece
ignorado. Não é necessária nenhuma alteração no backend nem no banco.

## Formulário e preparação de foto

O formulário reutilizável está em `src/components/produtos/ProdutoForm.tsx`.
Ele valida código/descrição, mostra erros da API junto aos campos, mantém o
preenchimento em falhas e impede envios repetidos enquanto aguarda `onSalvar`.
A tela que o utilizar deverá fornecer `onSalvar` e, opcionalmente, `onCancelar`.
Os valores iniciais são lidos ao montar o formulário; para editar outro produto,
monte uma nova instância (por exemplo, usando o ID como `key`).

`src/hooks/useFotoProduto.ts` gerencia seleção, cancelamento e preparação.
`src/lib/prepararFoto.ts` cria uma cópia JPEG no cache, com lado maior de até
1600 pixels, compressão 0,8 e limite de 4 MB medido após a conversão. Não altera
a imagem original nem guarda base64 no estado da tela. Arquivos HEIC dependem
do suporte de decodificação do sistema. Recursos nativos são liberados mesmo
quando a conversão falha. Cancelar o seletor preserva a foto anterior.

ImagePicker e ImageManipulator foram adicionados com `expo install` para o
SDK 58. O seletor é apenas de imagens, sem câmera ou microfone. As mensagens
personalizadas de permissões do app.json valem para builds próprios; o Expo Go
usa a configuração nativa que já vem nele.

**Novo produto** abre o formulário pelo botão na listagem e envia os dados
para a API. Veja a seção de cadastro abaixo.

`npm test` também testa o código real de preparação, com o adaptador nativo
simulado: conversão/configuração JPEG, limite exato de 4 MB, redimensionamento
sem ampliar fotos pequenas e liberação dos recursos em sucesso/falha. Esses
cenários não substituem escolher uma foto real no Expo Go do iPhone.

## Cadastro de produtos

- Na listagem, toque em **Novo produto**. A rota `src/app/produtos/novo.tsx`
  fica no Stack protegido da raiz, fora das abas, para abrir como tela separada.
- `ProdutoForm` continua responsável pelos campos, pré-visualização, validação
  e erros. `src/lib/produtos.ts` monta o multipart e faz `POST /produtos` pela
  requisição autenticada, usando o descritor de arquivo do FormData nativo.
- Não é enviado usuarioId nem status: a API associa o dono pelo JWT e cria
  o produto como ativo. O fetch define o boundary automaticamente.
- Durante o envio, campos e botões ficam bloqueados; o retorno pelo navegador
  nativo é impedido até concluir. Erros deixam os dados e a foto no formulário.
  Não há repetição automática depois de falha de rede.
- Sucesso remove a tela de cadastro da pilha, mostra aviso temporário e abre
  a primeira página sem filtros, para exibir o produto novo. A próxima abertura
  do cadastro começa vazia. Voltar após cancelar recarrega a lista e conserva
  os filtros anteriores. O hook usa useFocusEffect para sincronizar o retorno.

O upload com foto usa a implementação nativa de FormData (iOS/Android). A
versão de navegador foi usada para conferir navegação, validação, erros, dois
cadastros seguidos sem foto e preparação/pré-visualização da imagem; não é
o site Next.js nem uma implementação de upload web. Os testes de contrato
verificam o descritor multipart nativo sem acessar o Render ou o Cloudinary.

Após integrar e fazer pull, reinicie com `npx expo start --clear`. Não há nova
dependência, migração ou alteração de backend nesta etapa. No iPhone, confira:

1. Criar sem foto e ver o produto na lista.
2. Escolher uma foto (incluindo HEIC quando disponível), conferir a prévia e
   criar. Atualizar o site na mesma conta para verificar a miniatura recebida.
3. Abrir novo cadastro novamente e conferir campos vazios.
4. Usar um código já existente: os campos devem continuar preenchidos.
5. Cancelar e voltar à lista; sair da conta deve impedir abrir o cadastro.

As verificações automatizadas locais não criam registros no banco publicado.

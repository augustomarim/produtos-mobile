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
- `src/components/produtos/`: cartões, filtros, resumo, paginação e estado vazio.
- `src/hooks/useProdutos.ts`: consultas, busca, debounce, cancelamento e paginação.
- `src/hooks/useSaidaConta.ts`: confirmação e andamento do logout.
- `src/contexts/AuthContext.tsx`: estado compartilhado da autenticação.
- `src/lib/api.ts`: comunicação HTTP, erros e timeout.
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
protegida. Cadastro/edição, upload e ações em produtos serão implementados
nas próximas etapas; não há telas vazias simulando essas funcionalidades.

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
`codex/organiza-mobile`. Se o Desktop avisar sobre alterações locais ao trocar,
mantenha-as na branch original; não sobrescreva arquivos à força.

A branch foi preparada a partir de `9711a74`, reconstruindo os passos de
login/listagem feitos na conversa porque eles ainda não estavam no GitHub.
Se houver modificações locais adicionais, compare-as antes de integrar.
Após trocar, rode `npm ci` e `npx expo start --clear`. O `.env` local permanece
ignorado. Não é necessária nenhuma alteração no backend nem no banco.

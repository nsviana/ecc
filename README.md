# ECC — O Amor que nos Une e nos Envia

Aplicação local de apoio à dinâmica da 3ª reunião de um círculo de casais do Encontro de Casais com Cristo. Reúne oito roteiros originais de acolhida, partilha, Palavra e propósito, inspirados em Mt 28,16-20; Gl 3,27; Jo 13,34-35; e Jo 15,16-17. O material não é reprodução oficial do temário do ECC e pode ser adaptado pela equipe.

## Tecnologias

React, TypeScript estrito, Vite, CSS responsivo, Lucide React, localStorage e Vitest com Testing Library. Não há backend nem dependência de serviços externos. As fontes usam pilhas locais do sistema; nenhum recurso externo é carregado.

## Instalação e uso

Requer Node.js 20 ou superior.

```bash
npm install
npm run dev
npm run build
npm run preview
npm test
```

No Windows PowerShell com política que bloqueie `npm.ps1`, use `npm.cmd` no lugar de `npm`.

## Conteúdo editável

- `src/data/couples.ts`: somente IDs e nomes dos oito casais. Preserve os IDs estáveis ao editar nomes; IDs identificam progresso já salvo.
- `src/data/journeys.ts`: oito jornadas independentes, com tema, introdução, perguntas genéricas, referência, paráfrase, reflexão e propósito.
- `src/data/appConfig.ts`: título, subtítulo, reunião, mensagens, referências, armazenamento e caminhos de imagens.
- `src/types.ts`: contratos TypeScript do conteúdo e do estado.

As paráfrases são identificadas como tal e não são apresentadas como citações literais. Para inserir uma citação, atualize `textType`, `translation` e `source` com uma tradução cuja reprodução esteja autorizada. Os textos atuais não reproduzem literalmente uma tradução bíblica.

## Imagens

Coloque imagens locais em `public/images/` com estes nomes: `sagrada-familia.png`, `igreja-fundo.png`, `biblia-aberta.png`, `vitral.png`, `cruz.png` e `encerramento.png`. Os caminhos ficam centralizados em `src/data/appConfig.ts`. Atualmente, `sagrada-familia.png` aparece na tela inicial e `encerramento.png` na celebração final. Os outros quatro caminhos estão preparados para futuras telas e ainda não são usados pela interface. A arte principal e a tela final detectam imagem ausente e exibem uma composição CSS de reserva. As imagens usam `object-fit: cover` com enquadramento central, sem deformação.

## Progresso e controles

O progresso é salvo neste navegador/dispositivo em `localStorage` após cada mudança. Atualizar a página durante uma participação restaura casal e etapa; casais concluídos só são retirados após “Concluir e voltar ao encontro”. A equipe pode abrir “Organização” para ver o progresso, restaurar um casal, alternar animações, embaralhar os disponíveis ou reiniciar (com confirmação). Esses controles são locais e não têm autenticação.

IDs concluídos antigos que já não correspondam a um casal cadastrado são descartados ao ler o armazenamento. Participações atuais continuam vinculadas aos IDs, nunca à posição na lista. Ao mudar a composição dos participantes, edite a constante `participantVersion` de `appConfig.ts` se precisar acompanhar manualmente essa mudança; não há migração automática de dados de participantes removidos.

## Operação na TV

Mouse, setas e Enter operam elementos focáveis; Tab também percorre os controles. Escape/Backspace volta à etapa anterior e nunca conclui. “Tela cheia” usa a permissão disponível no navegador. O foco tem contorno dourado e a lista de casais rola quando necessário. Compatibilidade depende do navegador e do controle remoto: alguns modelos não enviam eventos de teclado padrão. Confira antecipadamente no equipamento da reunião. Na TV, prefira Full HD, desative zoom do navegador e verifique a margem segura do televisor.

Em celular, o seletor de casais se reorganiza em cartões de duas colunas e o conteúdo passa a rolar verticalmente, sem rolagem horizontal. Respeita a preferência de redução de movimento do sistema; o organizador também pode alternar animações.

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy.yml` publica ao enviar commits para `main` e envia `dist` ao GitHub Pages usando GitHub Actions. Para este repositório, o Vite gera os assets com base `/ecc/`. Em GitHub, habilite Pages com origem **GitHub Actions**. A URL esperada é `https://nsviana.github.io/ecc/`.

O site não usa roteamento do lado servidor. Os assets são empacotados pelo Vite, e as imagens opcionais devem estar em `public/images/`. Para validar o caminho de publicação localmente, defina `GITHUB_PAGES=true` e `VITE_BASE_PATH=/meu-projeto/` antes do build.

## Orientação ao apresentador

Reserve cerca de 2 a 3 minutos por casal. Apresente a pergunta, dê tempo à conversa sem apressar, leia a reflexão bíblica e convide o casal a formular o propósito em conjunto. Qualquer pergunta pode ser passada sem explicação. Os textos são curtos para sustentar uma dinâmica acolhedora, sem exposição de questões íntimas.

## Limitações conhecidas

O progresso é específico ao navegador e ao dispositivo e pode ser apagado pelo usuário. A tela final coletiva aparece quando todos os IDs cadastrados concluírem; não sincroniza entre dispositivos. Os controles administrativos não são protegidos por senha. A lista e os textos são editados nos arquivos TypeScript, não há CMS. O modo de tela cheia pode ser bloqueado pelo navegador e a navegação por controle remoto varia conforme o fabricante.

## Conteúdo pastoral — 3ª Reunião: O ECC

O tema desta edição é **Do Encontro à Missão**. O objetivo é recordar a experiência do Encontro de Casais com Cristo, reconhecer seus frutos e renovar o compromisso do casal com a família, a Igreja e a comunidade. Os roteiros e mensagens estão em `src/data/couples.ts`; abertura, referências, propósito e oração coletiva estão em `src/data/appConfig.ts`.

Os oito roteiros abordam memória e gratidão pelo Encontro, crescimento espiritual e Batismo, amor como testemunho, os cinco pontos da espiritualidade do ECC, vida de fé na família, participação na Igreja, frutos duradouros e missão evangelizadora. A pobreza de espírito é apresentada como humildade, desapego, disponibilidade e confiança em Deus, sem reduzi-la à falta de recursos materiais. As mensagens bíblicas estão identificadas como paráfrases.

Na celebração coletiva, o animador é lembrado de conduzir o Pai-Nosso, a Ave-Maria e o Glória; o aplicativo apoia a reunião e não conduz essas orações automaticamente.

As perguntas de partilha foram simplificadas para soarem como conversa entre os cônjuges. Cada cartão identifica quem responde e a quem a pergunta é dirigida; o casal pode passar uma pergunta sem justificativa.

## Roleta das jornadas

Ao selecionar um casal, a tela central apresenta a roleta. O resultado é escolhido uniformemente entre as jornadas sem atribuição e salvo antes da animação. O movimento visual dura cerca de 3,5 segundos e aponta para o resultado previamente escolhido; com redução de movimento ativada, o resultado aparece sem espera. Cada jornada só pode ser atribuída a um casal por dinâmica. A lista do painel de organização mostra casais, jornadas e situação; o organizador pode retomar participações ou cancelar uma atribuição com confirmação.

O formato do progresso em localStorage tem versão 2 e mantém a chave da aplicação. Dados do formato anterior não são sobrescritos automaticamente: uma confirmação na abertura inicia a dinâmica nova e guarda o conteúdo anterior em uma chave de backup local. A atribuição de jornada nunca é inferida dos antigos IDs de casais.

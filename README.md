# QuizRounds v3.34 — ADM com Subabas de Largura Total

## Mudanças da v3.34

- **Editar perguntas** agora usa subabas permanentes: **Editor | Banco | Importar**.
- O **Editor** ocupa a área principal e mantém a prévia ao lado em telas largas; em telas menores, a prévia passa para baixo.
- O **Banco** ocupa a largura total e pode mostrar mais cards por linha.
- **Importar** ganhou workspace próprio e textarea maior.
- **Configuração** agora usa: **Sala | Regras | Rounds**.
- **Regras** usa até três colunas em monitores largos para aproveitar melhor o espaço.
- **Rounds** usa a largura inteira para organizar a fila oficial.
- A área útil do ADM foi ampliada de 1380 px para até **1680 px** no desktop.
- As subabas preservam estado local e compartilham os mesmos dados/eventos, sem duplicação da lógica.
- Nenhuma alteração de banco foi necessária.

---

# QuizRounds v3.34 — Refatoração Canônica

## Refatoração

- CSS de produção separado em `core-v3.34.css`, `admin-v3.34.css` e `display-v3.34.css`.
- Removidas dependências das classes históricas `admin-v17`, `admin-v329` e `admin-v331`; o ADM usa apenas `admin-app`.
- Tokens antigos de versão foram substituídos por tokens semânticos.
- Grade de saúde consolidada em uma única progressão responsiva: 4, 3 e 2 colunas.
- Removidos keyframes sem uso e overrides comprovadamente redundantes.
- Ranking do jogador recebeu o estilo que faltava para `▲`, `▼` e `—`.
- Telão, ADM, jogador, controle remoto, simulador e Supabase mantêm o comportamento funcional da v3.32.

---

# QuizRounds v3.32 — Evento Estável + Insights

## Principais melhorias

- Verificação de versão entre ADM, telão e jogadores via Realtime; aparelhos antigos são sinalizados para recarregar.
- Pré-teste ampliado: Supabase, Realtime, telão, jogadores, perguntas, controle principal, remoto e versões.
- Simulador com atalhos para 20, 50 e 100 jogadores e teste completo automático local.
- Bloqueio visual contra clique duplo com estado PROCESSANDO até confirmação do servidor.
- Diagnóstico técnico da sessão com exportação TXT.
- Modo Evento mais enxuto, preservando os controles essenciais.
- Banners explícitos de reconexão no ADM, jogador e telão.
- Métricas separadas de cadastrados, conectados, respostas, pendentes e participação.
- Encerramento automático opcional ao atingir 100% de respostas ou ao esgotar o tempo.
- Reabertura do telão destacada quando o projetor não é detectado.
- Vibração curta no controle remoto para confirmação e mudança de fase.
- Exportação pós-evento ampliada com resumo por pergunta.
- Backup automático do banco de perguntas antes da substituição preservado.
- URL do jogador simplificada no telão; o PIN continua em destaque.
- Visual principal congelado: nenhuma remodelagem ampla de lobby/jogador/telão nesta versão.
- Tela final e ADM mostram a pergunta **mais acertada** e a **mais errada**, com contagem e percentual.

## Estatística de acerto

Para múltipla escolha, acerto significa resposta igual ao gabarito. Para perguntas numéricas, acerto estatístico considera correspondência exata com o valor correto. Rounds anulados são ignorados.

## Banco de dados

A migração `022_event_insights_v332.sql` adiciona os RPCs `admin_get_event_insights` e `get_public_event_insights`, com acesso anônimo bloqueado e execução apenas para sessões autenticadas autorizadas.

---

# QuizRounds v3.31 — Evento Estável / Controle Total

A v3.31 consolida a operação do quiz para uso em evento, mantendo o telão, o controle remoto pelo celular, o ADM responsivo e as alternativas A–E da versão anterior.

## Operação segura

- **Pré-teste da sala:** verifica Supabase/RPC, Realtime, telão, fila de perguntas e controlador principal antes do início.
- **Controlador principal:** um painel ADM completo recebe um lease temporário; outro painel entra em acompanhamento e pode assumir o controle mediante confirmação. O controle remoto autorizado continua disponível.
- **Modo Evento:** reduz o ADM ao que é necessário para conduzir a partida.
- **Botão de próxima ação:** conduz a sequência correta sem exigir que o operador escolha manualmente cada comando.
- **Parada de emergência:** congela pergunta aberta e preserva o tempo restante no servidor; ao retomar, o cronômetro continua do ponto congelado.

## Máquina de estados

Depois que uma pergunta é encerrada, o servidor exige a sequência: **Resposta → Distribuição → Ranking → Próximo round**. No último round, depois do Ranking, a próxima etapa é **Resultado final**. A sequência é validada também no Supabase, evitando pulos acidentais por outro dispositivo.

## Jogador e telão

- resposta enviada fica estática e confirmada no celular;
- reconexão informa que a sessão será retomada automaticamente;
- telão mantém alternativas estáticas A–E;
- ranking mostra mudança de posição;
- final mostra campeão + Top 5 por padrão, com opção de classificação completa;
- lobby não recebeu novos elementos, preservando a organização visual.

## Diagnóstico e teste

O painel de saúde mostra estado do banco, Realtime, telão, jogadores, fila e controlador. Os botões **Simular 20** e **Simular 50** abrem o simulador local em modo automático; eles não criam usuários reais nem contaminam a sala de produção.

## Supabase v3.31

As migrações 019–021 acompanham o pacote e já foram aplicadas ao projeto configurado nesta implementação:
- `019_event_control_hardening.sql`
- `020_result_reveal_state_machine.sql`
- `021_strict_reveal_transitions.sql`

---

# QuizRounds v3.30 — Respostas Estáticas A–E

## Alterações

- Alternativas do telão agora ficam estáticas, sem animação de entrada repetida/piscar durante sincronizações.
- Renderização das alternativas no celular foi estabilizada para não reconstruir os botões a cada atualização de estado.
- Símbolos geométricos foram substituídos pelas letras **A, B, C, D e E**.
- A quinta alternativa **E é opcional**; perguntas existentes com quatro alternativas permanecem válidas.
- Editor, prévia, TXT e correção de gabarito foram preparados para A–E.

---

# QuizRounds v3.29 — ADM Responsivo Canônico

## Principais mudanças

- Responsividade do ADM consolidada em uma única camada canônica.
- Removidas media queries legadas do ADM que já estavam substituídas.
- O painel não depende mais de `overflow-x:hidden` para esconder erros de largura.
- No celular, Perguntas ganhou subnavegação **Editar | Banco | Importar**.
- Header e abas principais ficaram menores e sticky no celular.
- Participantes agora usam card mobile com menu **⋯** para ações secundárias.
- Ações primárias e secundárias usam layouts distintos, evitando botões longos espremidos.
- Filtros horizontais ganharam indicação de deslizamento.
- Tablets entre aproximadamente 820 e 900 px preservam duas colunas quando há espaço.
- Container queries ajustam Editor e Banco ao espaço real do componente.
- Login mobile ficou mais compacto.
- Modal de pareamento e ADM respeitam safe-area de celulares com notch/barra inferior.
- Controle remoto e lógica da v3.28 foram preservados.

---

# QuizRounds v3.28 — ADM Responsivo

## O que mudou na v3.28

- O **painel ADM completo** agora se adapta a desktop, notebook, tablet e celular.
- Header e ações do administrador reorganizam automaticamente sem gerar scroll horizontal.
- As três abas continuam acessíveis e compactas no celular.
- O estúdio de perguntas muda de 3 colunas para 2 e depois 1 coluna conforme a largura.
- Editor, prévia, importação, banco, filtros e ações em lote passam a usar grids responsivos.
- Configuração, apresentação, QR do ADM, ranking, participantes, histórico e auditoria ocupam toda a largura disponível em telas menores.
- Inputs usam tamanho adequado no celular para evitar zoom automático em navegadores móveis.
- Modais e pareamento do controle remoto respeitam `100dvh` e safe areas.
- O **modo controle remoto da v3.27 foi preservado** sem alteração funcional.

## Validação v3.28

- JavaScript ativo validado com `node --check`.
- HTML verificado para IDs únicos e referências locais válidas.
- CSS revisado para evitar overflow horizontal do ADM.
- Supabase não precisou de nova migration nesta versão.

---

# QuizRounds v3.27 — Controle Remoto pelo Celular

## Controle remoto do administrador

- O administrador pode autorizar **um celular como controle remoto do telão** sem criar um aplicativo separado.
- No painel **Apresentação**, o botão **Autorizar celular** gera um QR Code e um código temporário de pareamento com validade de 5 minutos.
- O celular abre o mesmo `admin.html`, autentica com a **mesma conta ADM** e confirma o aparelho.
- Depois de autorizado, aparece o botão **Controle remoto**. O navegador autorizado permanece reconhecido naquele dispositivo até ser revogado.
- O painel possui **Revogar celulares** para invalidar todos os controles remotos autorizados.

## Modo remoto 100dvh

O modo compacto foi desenhado para uso com uma mão no celular e mostra somente o que é necessário durante a apresentação:

- sala e fase atual;
- round atual e cronômetro;
- pergunta atual;
- respostas recebidas e percentual de participação;
- status da internet;
- status **Telão conectado / Telão não detectado** via Presence do Realtime;
- botão contextual principal: começar, liberar, encerrar/pontuar, preparar próximo round ou retomar;
- **Pausar / Retomar** entre rounds;
- **+5 s / +10 s** durante pergunta aberta;
- revelação de **Resposta / Distribuição / Ranking**;
- controles avançados para **Anular round** e **Recomeçar partida**, protegidos por pressionar por 1 segundo e pelas confirmações já existentes.

## Segurança do pareamento

Migration nova: `supabase/migrations/016_admin_mobile_remote_control.sql`.

- Códigos de pareamento expiram em 5 minutos.
- O código só pode ser reivindicado pela mesma conta autorizada em `quiz_admins`.
- O token do navegador é armazenado no banco apenas como hash SHA-256.
- Tabelas de pareamento/dispositivos não possuem acesso direto por `anon` ou `authenticated`; o fluxo usa RPCs `SECURITY DEFINER` com verificação de administrador.
- RPCs do controle remoto foram explicitamente negados a `anon` e concedidos somente a `authenticated`.

## Compatibilidade preservada

- A lógica da v3.26 de lobby em 3 faixas foi mantida.
- Sala única, fila persistente, início com pelo menos uma pergunta, ranking, avatares e Cidade Viva continuam preservados.
- O telão passou a publicar Presence como `kind: display`, permitindo ao celular indicar se o telão está realmente conectado.

---

# QuizRounds v3.26 — Lobby de Telão em 3 Faixas

## O que mudou na v3.26

- Lobby reorganizado em **3 faixas reais dentro do 100vh**.
- A área central agora usa `minmax(0,1fr)` e distribui **PIN ~60% / QR ~40%**.
- Removido o limitador principal de altura do bloco PIN/QR: os cards aproveitam a altura disponível.
- **Rounds** virou badge junto de `PIN DA SALA`.
- A URL permanece disponível, mas em **uma linha discreta com ellipsis**.
- **Conectados, participantes e “Aguardando…”** agora ficam na mesma barra inferior.
- A mensagem de espera deixou de competir visualmente com o PIN.
- Mantido o QR grande, o 100vh e a Cidade Viva.

## Validação v3.26

- Referências ativas atualizadas para `v3.26`.
- JavaScript ativo validado com `node --check`.
- Estrutura HTML do lobby e CSS responsivo revisados sem alterar a lógica de sala/quiz.

---

# QuizRounds v3.25 — Lobby do Telão Reorganizado

## O que mudou na v3.25

- O lobby do telão foi **reorganizado para aproveitar melhor o espaço disponível**.
- PIN da sala, QR Code, rounds, URL de entrada, contadores e mensagem final ficaram **menos apertados e mais legíveis**.
- O card do PIN foi ampliado e o card do QR ganhou um **rótulo visual próprio**.
- Os contadores passaram para uma grade mais organizada, com melhor espaçamento e alinhamento.
- A base funcional da v3.24 foi preservada sem mexer na lógica do quiz.

## Validação v3.25

- Arquivos ativos versionados para `v3.25`.
- HTML do telão revisado e CSS do lobby reorganizado.
- JavaScript ativo validado com `node --check`.

---

# QuizRounds v3.24 — Correção da regressão do QR

## Correção

- A v3.23 foi descartada como base por ter alterado agressivamente o grid do lobby.
- A v3.24 parte novamente da **v3.22 estável**.
- O QR principal foi aumentado somente pelo seu próprio dimensionamento, preservando grid, PIN, 100vh, Cidade Viva e demais telas.
- Breakpoints de largura e altura receberam limites próprios para o QR não ultrapassar a área disponível.

## Validação

- JavaScript ativo validado com `node --check`.
- Estrutura do grid da v3.22 preservada.
- Sem alterações de lógica do quiz ou Supabase.

---

# QuizRounds v3.22 — Refatoração Canônica do Telão 100vh

## Refatoração aplicada

- Removidas as camadas antigas e concorrentes do CSS do telão (`v1.x`, `v3.19` e `v3.21`) que ainda redefiniam os mesmos componentes.
- Criada **uma única camada canônica** para conexão, header, lobby, perguntas, resultados e ranking.
- Lobby preso a **100vh / 100dvh**, sem rolagem do documento no telão.
- **PIN e QR Code permanecem lado a lado até 620 px de largura**; abaixo disso o empilhamento é compacto e continua dentro da viewport.
- Header do lobby foi reduzido e informações redundantes do lado direito ficam ocultas durante o lobby, pois os mesmos dados já aparecem no conteúdo principal.
- QR, PIN, contadores e textos agora respondem também à **altura da tela**, com ajustes específicos para projetores 720p/768p.
- A faixa dos avatares passou a ter sua altura determinada exclusivamente pelo grid do telão, eliminando o antigo conflito entre `position:absolute` e `position:relative`.
- A Cidade Viva também foi consolidada em uma única camada CSS, preservando **praia, cidade, fazenda e montanha**.
- Durante perguntas de múltipla escolha, as quatro alternativas passam a usar **grade 2 × 2 no desktop**, reduzindo o comprimento vertical e evitando sobreposição com a faixa dos avatares.
- O resultado usa duas colunas em telas largas e reorganização responsiva em telas menores.
- Nenhuma lógica de sala, pergunta, resposta, ranking, Supabase ou sincronização foi removida.

## Validação v3.22

- `app-v3.22.css`, `avatars-v3.22.css` e `player-v3.22.css`: **0 erros de parse**.
- **0 seletores exatos duplicados no mesmo contexto** nos três CSS ativos.
- Entre `app-v3.22.css` e `avatars-v3.22.css`, não há sobreposição de seletores funcionais do telão; apenas `:root` é compartilhado.
- Todos os módulos JavaScript ativos passam em `node --check`.
- HTML validado para IDs únicos e referências locais existentes.

---

# QuizRounds v3.21 — Lobby 100vh Compacto

## O que mudou na v3.21

- Lobby do telão dimensionado para **100vh / 100dvh** em desktop, sem depender de zoom reduzido do navegador.
- Header do telão, PIN, QR Code, cards de contagem, mensagem de espera e faixa dos avatares foram compactados verticalmente.
- PIN e QR permanecem **lado a lado** em desktop e widescreen.
- Regra especial para telas baixas (até 760 px de altura) reduz ainda mais QR, PIN e faixa de avatares.
- Em telas estreitas, o layout continua responsivo e pode empilhar os blocos para preservar legibilidade.
- Arquivos ativos antigos v3.18, v3.19 e v3.20 foram removidos do pacote final para eliminar código morto e risco de referência conflitante.

## Validação v3.21

- HTML, CSS e referências locais verificados.
- JavaScript ativo validado com `node --check`.
- Estrutura do lobby preserva sala, QR, PIN, jogadores, cenários e animações existentes.

---

# QuizRounds v3.20 — Grid do Lobby Corrigido

## O que mudou na v3.20

- **PIN da sala e QR Code agora ficam lado a lado** no lobby do telão em desktop.
- O grid do lobby foi refeito para **caber em 100% de zoom**, sem precisar reduzir o zoom do Chrome para 50%.
- O card do PIN foi compactado e o QR Code foi redimensionado para melhor equilíbrio visual.
- A quebra responsiva agora acontece apenas quando a largura realmente exigir, mantendo o layout lado a lado em telas de apresentação comuns.
- Mantidas as melhorias da v3.19 e o catálogo ampliado de avatares da v3.18.

## Validação v3.20

- Referências dos arquivos atualizadas para `v3.20`.
- JavaScript ativo validado com `node --check`.
- Ajuste feito sem alterar a lógica do quiz, salas, ranking e sincronização.

---

# QuizRounds v3.19 — Telão Reorganizado + Cenários dos Avatares

## O que mudou na v3.19

- **Telão / projetor reorganizado** para evitar elementos um por cima do outro quando o quiz começa.
- O conteúdo principal do telão agora fica em uma **área própria** e a faixa dos avatares fica separada na base, sem cobrir lobby, pergunta, resultado ou ranking.
- A Cidade Viva ganhou **4 cenários de fundo** para os avatares: **praia, cidade, fazenda e montanha**.
- O cenário é aplicado automaticamente no telão e exibe um **selo visual do cenário atual**.
- O bloco **Abrir telão / projetor** no ADM foi refeito e separado do restante dos comandos.
- **Abrir telão / projetor** reutiliza a janela do telão quando ela já estiver aberta.
- **Abrir telão em nova janela** agora abre uma janela dedicada, centralizada e maior para uso com projetor/TV.
- O catálogo ampliado de avatares da v3.18 foi mantido: animais, pessoas masculinas/femininas, anime masculino/feminino e fantasia.

## Compatibilidade funcional preservada

- Fluxo de sala, lobby, rounds, ranking e sincronização Supabase mantidos.
- Caminhada, conversa, brincadeira, pulo, dança e comemoração dos avatares continuam preservados.
- `prefers-reduced-motion` continua respeitado.

## Validação v3.19

- HTML principal revisado com nova estrutura do telão.
- CSS ativo validado sem referências quebradas entre `admin`, `player` e `display`.
- JavaScript ativo validado com `node --check`.
- Referências locais atualizadas para os arquivos `v3.19`.

---

# QuizRounds v3.18 — Catálogo Ampliado de Avatares + Cidade Viva

## O que mudou na v3.18

- **48 avatares** organizados por categorias para não sobrecarregar a tela do jogador.
- **Animais (16):** inclui raposa, gato, panda, leão, cachorro, coelho, tigre, urso, coala, macaco, pinguim, lobo e outros.
- **Pessoas masculinas (8)** e **pessoas femininas (8)** com variações de aparência, cabelo e acessórios.
- **Anime genérico masculino (4)** e **anime genérico feminino (4)**, sem depender de personagens licenciados.
- **Fantasia/clássicos (8):** robô, astronauta, ninja, alien, mago, fada, pirata e detetive.
- O seletor ganhou **filtros por categoria**, rolagem compacta e mantém boa utilização em celular, tablet e desktop.
- Todos os 12 avatares já existentes continuam válidos para sessões/salas antigas.
- A cidade viva, ranking e painel ADM utilizam automaticamente o novo catálogo.

## Compatibilidade funcional preservada

- A lógica v3.17 de **sala única**, **fila de perguntas persistente** e **início com pelo menos 1 pergunta** foi mantida sem alteração.
- Caminhada, conversa, brincadeira, pulo, dança, deslocamento lateral e comemoração dos avatares continuam preservados.
- `prefers-reduced-motion` continua respeitado.

## Supabase

Migration nova: `supabase/migrations/015_avatar_catalog_expanded.sql`.

Ela amplia `private.normalize_avatar_key(text)` para aceitar exatamente o mesmo catálogo do frontend. Em uma instalação nova, execute as migrations em ordem de `001` até `015`.

## Validação v3.18

- JavaScript ativo validado com `node --check`.
- Catálogo JS: 48 chaves únicas em 6 categorias.
- Migration 015 e catálogo frontend verificados para conter as mesmas 48 chaves.
- HTML com IDs únicos e referências locais válidas.
- CSS ativo parseado sem erro.
- Compatibilidade das chaves antigas conferida.

---

# Histórico preservado — v3.16 e anteriores

# QuizRounds v3.16 — Cidade Viva + Start Guard

## Correções e melhorias v3.16

- Corrigida a causa raiz do caso em que **Iniciar quiz** parecia não funcionar: participantes e perguntas podiam terminar em salas diferentes após criar outra sala.
- O botão de início agora verifica **Sala / Participantes / Perguntas** e explica o bloqueio em vez de simplesmente ficar inativo.
- Se a sala atual tiver jogadores e nenhuma pergunta, o ADM pode recuperar, com confirmação, uma fila completa de uma sala anterior compatível.
- Criar outra sala agora exige confirmação quando a sala atual já possui participantes, fila ou rounds, deixando claro que jogadores/perguntas não são transferidos automaticamente.
- O ADM lembra a sala atual no navegador e tenta retomá-la pelo ID antes de abrir outra sala recente.
- A função estável `admin_start_quiz` foi preservada; a correção adiciona uma camada de preflight/recuperação ao redor dela.
- Teste transacional real executado no Supabase: recuperação da fila + `admin_start_quiz` retornou preparação do Round 1; tudo foi revertido com ROLLBACK após o teste.

## Cidade Viva v3.16

- Os avatares agora alternam comportamentos: **andar, parar, pular, acenar/conversar, brincar, dançar e virar de direção**.
- No lobby, personagens podem se aproximar em pares para **conversar ou brincar juntos**.
- Interações usam um controlador de estados temporizado, sem loop por frame, preservando desempenho com muitos participantes.
- O DOM da população não é reconstruído a cada ação; cada personagem mantém sua instância, evitando piscar.
- Até 120 avatares continuam suportados no telão.
- `prefers-reduced-motion` mantém a cidade estática para acessibilidade.

## Refatoração / CSS / estabilidade

- `avatars-v3.16.css` reconstruído de forma limpa para os novos estados, sem empilhar overrides da v3.15.
- CSS principal e do jogador continuam baseados na arquitetura limpa da v3.14.
- Auditoria final: **0 erros de parse CSS**, **0 seletores exatos duplicados no mesmo contexto** nos CSS ativos refatorados.
- HTML sem IDs duplicados e sem referências locais quebradas.
- Todos os módulos JavaScript ativos passaram em validação de sintaxe.

## Supabase v3.16

Migration nova: `supabase/migrations/013_admin_room_recovery_start_guard.sql`.

No projeto Supabase atual usado durante o desenvolvimento, esta migration já foi aplicada como `admin_room_recovery_start_guard_v316`. Em uma instalação nova, rode as migrations em ordem até `013`.

---

# QuizRounds v3.15 — Avatares + Cidade dos Jogadores

## Novidades v3.15

- Jogador escolhe **nome + avatar** antes de entrar.
- 12 avatares animados: Raposa, Robô, Gato, Astronauta, Ninja, Panda, Alien, Leão, Sapo, Unicórnio, Tubarão e Coruja.
- O avatar escolhido fica salvo no navegador e no participante da sala.
- Ranking do jogador e ranking do telão mostram o avatar.
- Lista de participantes do ADM mostra o avatar de cada jogador.
- O modo **Abrir telão / projetor** ganhou a **Cidade dos Jogadores**: prédios, parque, rua e avatares caminhando continuamente.
- No lobby a cidade fica maior; durante pergunta/resultado ela vira uma faixa compacta para não esconder o conteúdo.
- Top 3 ganha destaque na cidade depois que existe pontuação (coroa / prata / bronze).
- Jogadores desconectados continuam visíveis temporariamente em estilo dessaturado.
- A cidade usa animação CSS com `transform`, sem loop JavaScript por frame, para reduzir custo de CPU/GPU.
- A lista da cidade só é recriada quando participantes/avatar/pontos/conexão realmente mudam, evitando piscadas.
- `prefers-reduced-motion` desativa as animações para acessibilidade.

## Supabase v3.15

Migration nova: `supabase/migrations/012_player_avatars_city.sql`.

No projeto Supabase atual usado durante o desenvolvimento, esta migration já foi aplicada. Para uma instalação nova, rode as migrations em ordem até `012`.

A migration adiciona `quiz_participants.avatar_key` e as RPCs `join_quiz_room_v2`, `player_set_avatar` e `get_public_avatar_roster`, mantendo `join_quiz_room` antigo compatível.

---

# QuizRounds v3.14 — CSS/HTML Refactor Profissional

## v3.14 — auditoria estrutural completa

- `app-v3.14.css` reconstruído a partir da base funcional estável, removendo as camadas de correção v3.6/v3.10/v3.12/v3.13 que se sobrepunham.
- **0 seletores exatos duplicados** no CSS principal após a consolidação.
- CSS principal reduzido de aproximadamente **126 KB para 78 KB**, sem alteração das regras de jogo/Supabase.
- Código morto do jogador removido do `app.css`; o jogador continua isolado em `player-v3.14.css`.
- Simulador consolidado em `simulator-v3.14.css`, removendo regras duplicadas aditivas.
- Tokens, reset, contratos anti-overflow, `minmax(0, ...)`, `min-width: 0`, `dvh` e breakpoints reorganizados em uma única camada de layout.
- Header ADM refeito em formato compacto: marca à esquerda, status e ações organizadas, reflow em notebook e grade 2×2 no celular.
- Question Studio continua **full-width** e usa o scroll vertical da própria página; desktop usa Editor | Prévia/Lote | Biblioteca e reduz progressivamente para duas/uma coluna.
- Configuração e Apresentação agora usam uma grade de 12 colunas coerente, sem larguras fixas conflitantes.
- Acessibilidade: skip link, roles de tabs/tabpanel, status de conexão com `aria-live`, foco visível e `prefers-reduced-motion`.
- Contraste revisado nos pares principais (texto/header, botões, muted e alertas) com razão WCAG AA ou superior para texto normal nos pares críticos avaliados.
- Nenhuma migration nova e nenhum JavaScript funcional foi alterado.

## v3.13 — Edite e prepare suas perguntas

- A aba **Editar perguntas** virou um workspace em 100vh com quatro funções claras: **Criador**, **Prévia ao vivo**, **Organizador** e **Banco de Perguntas**.
- Criador guiado em 4 etapas: enunciado, respostas/gabarito, pontuação/tempo e organização.
- **Edição real** de perguntas existentes: o botão Editar carrega todos os dados e salva no mesmo registro, sem criar cópia. Snapshots de partidas/filas já preparadas permanecem preservados.
- Prévia ao vivo no estilo do jogador enquanto o ADM digita, com alternativas coloridas, pontos, tempo, categoria e dificuldade.
- Presets rápidos de pontuação (10/50/100/500) e tempo (10/20/30/60 s).
- Banco com pesquisa, categoria, dificuldade, uso, arquivo e ordenação por data, nome, categoria, dificuldade, pontos ou utilização.
- Filtros rápidos: **Todas, Escolha, Número, Não usadas, Desempate, Sem pontos e Finais**.
- Chips de categorias e indicadores do banco: visíveis, escolha, numéricas e média de pontos.
- Seleção em lote para adicionar à sala, arquivar/restaurar e selecionar tudo que está visível.
- Importação/exportação TXT continua integrada ao mesmo workspace, nos modos **Adicionar** e **Substituir tudo**.
- Visual competitivo/festivo com gradientes, brilho controlado, cards de game show e microanimações; `prefers-reduced-motion` é respeitado.
- Desktop usa três áreas simultâneas; notebook reorganiza em duas colunas; celular usa coluna única sem sobreposição e sem scroll horizontal.
- CSS/JS versionados como `v3.13`.

## Atualização do projeto online existente

Use o mesmo projeto **QuizRounds** no Supabase e o mesmo repositório GitHub. A função de edição `admin_update_question_v3` já foi aplicada ao Supabase atual. Para outra instalação nova, aplique as migrations `001` a `011` em ordem.

# Quiz Rounds v3.8 — Supabase + GitHub Pages + Simulador

## v3.8 — refatoração limpa do modo Jogador

- `index.html` deixou de carregar o CSS compartilhado antigo do ADM/Telão.
- Nova folha exclusiva `assets/css/player-v3.8.css`, reconstruída para o jogador.
- Layout 100vh/100svh com Grid + Flexbox e scroll apenas na área útil.
- Corrigido painel de entrada excessivamente alto, texto aparecendo por trás do formulário e sobreposição entre hero/form.
- Desktop: apresentação e formulário lado a lado; tablet/celular: composição em coluna única.
- Tela de jogo, alternativas, ranking, Top 5 e retomada permanecem responsivos.
- Nenhuma lógica Supabase, autenticação, rounds, ranking ou retomada foi alterada.


Quiz ao vivo responsivo para celular, PC e projetor, preparado para 50+ participantes e teste local de até 200 jogadores. O administrador controla todo o evento por login/senha, banco de perguntas, configuração da sala e modo Apresentação.

## v3.7 — Jogador 100vh + proteção de chave no GitHub Pages

- `index.html` refeito para ocupar **100vh** no PC e no celular, com header em fluxo e conteúdo usando somente a área restante.
- Entrada, pergunta, alternativas e ranking usam **Grid/Flexbox responsivos**, sem sobreposição nem overflow horizontal.
- Em telas pequenas o jogo passa para uma coluna e a rolagem fica dentro da área útil, mantendo o app preso ao viewport.
- Breakpoints adicionais para celulares estreitos e telas com pouca altura.
- O botão de som/trocar sala não usa mais posicionamento absoluto no celular, evitando elementos sobrepostos.
- GitHub Actions agora **recusa qualquer chave `sb_secret_`** antes de publicar.
- O deploy aceita somente uma chave que comece com `sb_publishable_`.
- `common-v3.7.js` também valida a configuração e impede inicialização com chave secreta.
- Base inclui a migration `008_game_show_complete.sql` corrigida.
- Assets principais foram versionados como `app-v3.7.css`, `simulator-v3.7.css` e scripts `*-v3.7.js`.

## Arquitetura

- **Supabase:** Authentication, PostgreSQL, RPC/Database Functions, RLS, Broadcast privado, Presence, heartbeat, ranking, auditoria e persistência.
- **GitHub:** repositório e GitHub Pages via GitHub Actions.
- **Frontend:** HTML/CSS/JavaScript estático e responsivo.
- **Segurança:** frontend usa somente Project URL + Publishable Key. Nunca coloque `service_role`/secret key no navegador.
- **Simulador:** isolado do Supabase real e com estado local próprio.

## v3.7 — Grid + Flexbox + responsividade consolidada

### CSS v3.7 — Layout estrutural responsivo em 100vh

- **CSS Grid** passou a controlar a estrutura macro das abas, banco de perguntas, configuração, apresentação, jogador, telão e simulador.
- **Flexbox** passou a controlar cabeçalhos, ações, filtros, grupos de botões, status e alinhamentos internos.
- A aba Perguntas usa um grid de 12 colunas no desktop, composição adaptativa no notebook e coluna única no tablet/celular.
- Todos os filhos críticos usam `min-width: 0`, evitando que textos, filtros e botões invadam cards vizinhos.
- O Painel ADM continua limitado a **100vh**, com rolagem somente nas áreas que precisam dela.
- Breakpoints consolidados em desktop amplo, notebook, tablet, celular e celular estreito, sem larguras fixas que forcem overflow horizontal.
- Jogador usa grid para pergunta + ranking e muda para uma coluna em telas menores.
- Telão usa grid responsivo para lobby, alternativas e ranking, preservando legibilidade.
- Simulador usa o mesmo princípio de Grid/Flexbox para manter comportamento semelhante ao projeto real.

### Base preservada da v3.4 — Aba Perguntas em 100vh

- Painel ADM limitado a **100vh**, com rolagem controlada dentro das abas em vez de crescimento indefinido da página.
- Em desktop amplo, **Editor | Importação/Exportação | Banco de Perguntas** usam três colunas simultâneas e toda a altura útil disponível.
- Em notebooks, o editor ocupa a coluna esquerda e Importação/Banco dividem a direita, cada área com rolagem interna independente.
- Em celular, a aba passa para uma única coluna rolável dentro dos 100vh, sem sobreposição, compressão de cards ou overflow horizontal.
- Banco de perguntas usa a altura restante para a lista, mantendo filtros organizados e sem cobrir outros componentes.
- Editor e importação tiveram espaçamentos/controles compactados apenas visualmente, preservando todos os IDs e funções existentes.
- Área útil do ADM ampliada até 1680 px em monitores grandes para aproveitar melhor telas Full HD e superiores.


### Painel ADM

- Login administrativo via Supabase Authentication + autorização em `quiz_admins`.
- Abas **Editar perguntas**, **Configuração** e **Apresentação**.
- Banco de perguntas reutilizável, arquivamento/restauração e duplicação.
- Busca e filtros por categoria, dificuldade, uso e arquivo.
- Importação/exportação TXT em lote e copiar/colar com pré-validação.
- Exportação completa inclui **gabarito/resposta correta, alternativas, pontuação, tempo, categoria, dificuldade, bônus, desempate, estado arquivada e nota do apresentador**.
- Importação em dois modos: **Adicionar ao banco** ou **Substituir tudo**.
- Em **Substituir tudo**, o lote inteiro é validado antes; o banco anterior é retirado da operação somente dentro da mesma transação que cria o novo lote.
- Backup TXT automático opcional antes da substituição. Perguntas históricas são mantidas internamente inativas para preservar rounds e relatórios antigos.
- Perguntas de múltipla escolha e numéricas/mais próximo.
- Pontuação, tempo, categoria, dificuldade, bônus de velocidade, desempate, pergunta sem pontuação e nota privada do apresentador.
- Fila oficial com subir/descer e arrastar-e-soltar antes da partida.
- Ordem manual, **Embaralhar agora** e **Ordem aleatória ao começar**.
- Modelos de partida, duplicar sala e modo ensaio.
- Temas, logo, sons e lista de palavras bloqueadas nos nomes.

### Lobby e apresentação

- PIN grande, QR Code e link direto com PIN pré-preenchido.
- Contagem de cadastrados, conectados, respostas e pendentes.
- Teste ativo de conexão antes do início.
- Latência do painel em milissegundos.
- Tela separada para TV/projetor com QR permanente e botão de tela cheia.
- Prévia privada da próxima pergunta e notas do apresentador.
- Contagem sincronizada **3…2…1** antes de liberar a pergunta.
- Pausar/retomar entre rounds.
- Estender pergunta em +5 s ou +10 s antes do prazo.
- Encerramento manual ou automático quando todos responderem.
- Revelação em etapas: resposta → distribuição → ranking.
- Mudanças de posição no ranking.
- Anular round e retirar os pontos.
- Corrigir gabarito e recalcular o ranking.
- Recomeçar partida mantendo participantes e voltando ao Round 1.

### Competição

- Modo classificação com Top N configurável.
- Cortes progressivos por round, ex.: `5:30, 10:15, 15:5, 20:1`.
- Final visual para Top 5 e campeão.
- 1º dourado, 2º prata/azulado, 3º bronze, 4º violeta e 5º verde.
- Sequência de acertos (streak) e bônus opcional.
- Bônus de velocidade por pergunta.
- Desempate determinístico.
- Perguntas sem pontuação.
- Numéricas: menor diferença absoluta; empate por tempo e critério estável.

### Jogador — celular e PC

- Layout responsivo para celular/desktop.
- PIN + nome e entrada por QR/link.
- Sessão persistente no mesmo navegador/dispositivo.
- Ao fechar e reabrir, retorna com o mesmo nome no estado atual.
- Rounds encerrados durante a ausência ficam como **0 ponto** e não podem ser recuperados.
- Proteção contra múltiplas abas: uma aba responde; outra fica somente leitura.
- Feedback de resposta enviada, acerto/erro, pontos do round, total e classificação.
- Zona de classificação e quantas posições precisa subir.
- Streak e mudança de posição.
- Tema Top 5/campeão somente após o resultado, sem atrapalhar a pergunta.
- Som opcional e suporte a `prefers-reduced-motion`.

### Participantes e segurança operacional

- Presence para online/offline e heartbeat como fallback.
- Broadcast privado para mudanças de estado e progresso.
- Polling de contingência quando o WebSocket oscila.
- Estado oficial no Supabase; navegador não decide round, prazo ou pontos.
- Prazo calculado e validado no servidor.
- Uma resposta por participante/round, de forma idempotente.
- `game_generation` invalida estado antigo após reinício.
- Política de entrada tardia: permitir com zero, permitir até round X ou bloquear.
- Nomes duplicados configuráveis.
- Palavras bloqueadas configuráveis.
- Remover/bloquear participante por dispositivo/sessão.
- Snapshot da pergunta e do resultado por round.
- Auditoria de ações administrativas.

### Histórico e relatórios

- Histórico por round/jogador.
- Resposta, tempo, pontos, ausência e posição.
- Lista operacional com respostas, rounds perdidos, heartbeat e detalhes de cada participante.
- Gráfico de evolução de posição por round.
- Exportação CSV.
- Ranking final persistido.

## Simulador local

Execute `01_Abrir_Simulador.bat`.

**Login de teste do simulador:**

- Usuário: `admin`
- Senha: `quiz123`

O simulador não usa nem altera o Supabase real. Ele reproduz:

- login ADM;
- banco e editor de perguntas;
- importação/exportação TXT no simulador com os modos **Adicionar** e **Substituir tudo**, usando o mesmo formato do ambiente real;
- fila, configuração e ordem aleatória;
- lobby, PIN e QR;
- 1 a 200 jogadores simulados;
- celular de teste integrado;
- 3…2…1, rounds, tempo, respostas e ranking;
- classificação, Top 5, streak, velocidade e numéricas;
- desconectar/reabrir celular e perder rounds com 0;
- pausa, extensão, anulação, reclassificação e reinício;
- teste de estabilidade/carga.

## Supabase — instalação

1. Crie/selecione um projeto Supabase.
2. Em **Authentication**, habilite **Anonymous Sign-Ins** para jogadores e display.
3. Aplique as migrations em ordem:
   - `001_quiz_rounds.sql`
   - `002_question_archive_queue_timer.sql`
   - `003_admin_event_display.sql`
   - `004_stability_hardening.sql`
   - `005_admin_txt_import.sql`
   - `006_player_resume_missed_rounds.sql`
   - `007_restart_random_order.sql`
   - `008_game_show_complete.sql`
   - `009_question_bank_replace_import.sql`
   - `010_min_one_participant_start.sql`
   - `011_question_editor_update.sql`
4. Crie o usuário administrador em **Authentication > Users** com e-mail e senha.
5. Edite o e-mail em `supabase/ADMIN_BOOTSTRAP.sql` e execute no SQL Editor.
6. Use somente a **Project URL** e a **Publishable Key** no frontend.

> A migration de estabilidade cria apenas políticas RLS em `realtime.messages`; não cria/altera objetos do schema `realtime`.

## GitHub Pages

No repositório, configure:

- Repository variable: `SUPABASE_URL`
- Repository secret: `SUPABASE_PUBLISHABLE_KEY`

Depois configure **Settings > Pages > Source: GitHub Actions**.

O workflow `.github/workflows/pages.yml` publica apenas:

- `index.html`
- `admin.html`
- `display.html`
- `simulator.html`
- `assets/`

As migrations e o bootstrap administrativo não são publicados no Pages.

## Fluxo recomendado do evento

1. ADM entra em `admin.html`.
2. Prepara/importa as perguntas. Para trocar todo o banco de uma vez, selecione **Substituir tudo**, valide o TXT e confirme a substituição.
3. Cria/configura a sala e a fila de rounds.
4. Abre a aba **Apresentação** e o telão.
5. Jogadores entram pelo QR/PIN/link.
6. ADM testa as conexões.
7. Inicia o quiz.
8. Cada round passa por preparar → 3…2…1 → pergunta → resultado.
9. O ADM revela resposta/distribuição/ranking e prepara o próximo round.
10. No final, o telão mostra campeão/pódio e o ADM pode exportar o relatório.


## v3.7 — correção e refatoração CSS

- Corrigidos conflitos de flex/grid acumulados no ADM, jogador, telão e simulador.
- Filtros do banco de perguntas agora quebram linha sem estourar os cards.
- Importação/exportação TXT ganhou layout responsivo estável em celular e desktop.
- Ações do modo Apresentação foram reorganizadas para evitar botões comprimidos/sobrepostos.
- Grids usam `minmax(0, ...)`/`min-width: 0` para impedir overflow causado por textos longos.
- Telão e ranking tratam nomes/textos longos sem cortar a estrutura.
- Jogador usa viewport dinâmico (`dvh`/`svh`) e remove `background-attachment: fixed` no mobile.
- Simulador recebeu as mesmas correções de overflow, grids e drawer do celular de teste.
- CSS versionado em `app-v3.7.css` e `simulator-v3.7.css`; os nomes antigos de folhas de estilo não são mais referenciados pelos HTMLs.


## v3.13 — refatoração de aproveitamento de tela
- Removida a camada legada v3.6 que ainda reposicionava `.bank-card` e causava o grande vazio à direita.
- Question Studio passa a ter uma única camada de layout, com áreas explícitas: Editor 38% | Prévia/Lote 24% | Biblioteca 38%.
- Biblioteca usa duas colunas de cards quando o próprio painel tiver largura suficiente.
- Editor usa a largura interna para colocar Regras e Organização lado a lado quando couber.
- Header, navegação, hero e toolbar ficam mais compactos enquanto a aba Perguntas estiver ativa, recuperando altura útil.
- Scroll independente no Editor, Lote e Biblioteca no desktop; reflow progressivo em notebook/tablet/celular.
- Nenhuma migration nova: backend/Supabase da v3.11 permanece compatível.


## v3.13 — scroll da página e importação TXT
- A aba Editar perguntas usa a barra de rolagem principal do navegador para subir e descer por todo o workspace.
- O parser TXT ignora cabeçalhos/comentários iniciados por # e não cria mais um bloco vazio antes da primeira pergunta.
- O botão de importação não falha silenciosamente: quando há erro, mostra a quantidade e direciona para o primeiro bloco inválido.
- Arquivos TXT válidos são analisados automaticamente ao selecionar o arquivo.
- Inclui `20_Perguntas_Teste.txt`, validado para importação direta.


## v3.18 — Avatares ampliados
- 48 avatares organizados por 6 categorias.
- Animais, pessoas masculinas/femininas, anime genérico masculino/feminino e fantasia.
- Filtro por categoria no celular e desktop.
- Chaves antigas preservadas para salas e sessões existentes.
- Migration `015_avatar_catalog_expanded.sql` amplia a normalização no Supabase.

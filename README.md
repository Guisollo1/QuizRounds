# QuizRounds v3.12 — Question Studio

## v3.12 — Edite e prepare suas perguntas

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
- CSS/JS versionados como `v3.12`.

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


## v3.12 — refatoração de aproveitamento de tela
- Removida a camada legada v3.6 que ainda reposicionava `.bank-card` e causava o grande vazio à direita.
- Question Studio passa a ter uma única camada de layout, com áreas explícitas: Editor 38% | Prévia/Lote 24% | Biblioteca 38%.
- Biblioteca usa duas colunas de cards quando o próprio painel tiver largura suficiente.
- Editor usa a largura interna para colocar Regras e Organização lado a lado quando couber.
- Header, navegação, hero e toolbar ficam mais compactos enquanto a aba Perguntas estiver ativa, recuperando altura útil.
- Scroll independente no Editor, Lote e Biblioteca no desktop; reflow progressivo em notebook/tablet/celular.
- Nenhuma migration nova: backend/Supabase da v3.11 permanece compatível.

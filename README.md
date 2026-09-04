# QuizRounds v3.45 — Refatoração do jogador

- `index.html` reorganizado para PIN/Nome → avatares → confirmação → Entrar no lobby.
- Somente a grade dos avatares possui rolagem vertical.
- Scroll horizontal dos avatares eliminado estruturalmente.
- Botão Entrar no lobby ocupa linha própria e não depende de `sticky` ou `fixed`.
- Entrada automática concorrente removida; QR apenas preenche/trava o PIN.
- Estado do botão: Entrar no lobby → Entrando… → Conectado ✓.
- Timeouts de conexão evitam CTA aparentemente travado.
- Apenas o avatar selecionado anima no seletor, reduzindo uso de CPU/GPU.
- `APP_VERSION` corrigido para 3.45.
- Nenhuma migration adicional do Supabase.

---

# QuizRounds v3.45 — Entrada QR e seletor de avatares corrigidos

## Correções v3.45

- O CTA do jogador agora é **Entrar no lobby** e permanece visível após a seleção do avatar.
- O seletor não cria mais barra de rolagem horizontal.
- Os 48 avatares continuam disponíveis em uma única grade, com colunas que se ajustam automaticamente à largura do card.
- A grade usa somente rolagem vertical quando não houver altura suficiente para mostrar todos os avatares.
- Em sessão salva com falha de retomada automática, o usuário recebe uma instrução para confirmar o avatar e tocar em **Entrar no lobby**.
- Não houve alteração de banco de dados.

---

# QuizRounds v3.45 — Correção de entrada pelo QR Code

- Corrigido botão de entrada que ficava fora da área visível após a grade com 48 avatares.
- O CTA agora aparece como **Entrar no quiz** e permanece acessível no celular.
- Entrada por QR usa layout mais compacto para preservar o botão e a grade de avatares.
- Nenhuma alteração no Supabase ou na lógica do jogo.

---

# QuizRounds v3.45 — contraste, avatares e entrada no lobby

- Texto preto nas partidas recentes e na jornada Sala → Perguntas → Regras → Revisar → Lobby.
- Conflito com a cor branca global dos botões removido na origem.
- Tipografia operacional do ADM padronizada em 13 px, texto operacional e metadados em 13 px e títulos hierárquicos.
- “Escolha seu avatar” removido da interface visível.
- Todos os 48 avatares aparecem juntos, sem filtros/categorias.
- Botão “Entrar no lobby” restaurado abaixo da seleção.
- Seleção de avatar não reconstrói a grade nem perde a posição de rolagem.
- Sem alteração de banco/Supabase.

---

# QuizRounds v3.45 — Hardening pós-auditoria

Esta versão preserva a lógica estável da v3.40 e corrige os pontos encontrados na auditoria completa: segurança de RPCs, performance do banco, limpeza de logos, HTTPS, tema, contraste, acessibilidade, timers e documentação.

> Observação: a proteção de senhas vazadas é uma configuração do Supabase Auth/GoTrue e não é controlada por migrations SQL do projeto. O pacote não altera essa configuração externa.

---

# QuizRounds v3.45 — Logo por upload ou link

## Logo do evento

- O ADM permite **colar um link** ou **selecionar uma imagem do computador/celular**.
- Upload direto para o Supabase Storage com PNG, JPG ou WebP de até 5 MB.
- Prévia antes de aplicar e indicação da proporção detectada.
- A URL gerada pelo upload é salva na mesma configuração `logo_url` já usada pelo projeto.
- Botão para remover a logo sem afetar tema, perguntas ou sala.

## Encaixe automático

- A imagem usa `contain`, preservando a proporção original sem recorte nem deformação.
- O sistema detecta logo **horizontal, paisagem, quadrada ou vertical**.
- ADM, telão e jogador possuem limites próprios de largura/altura para a logo.
- Logos muito largas ganham um slot horizontal controlado; logos altas permanecem estreitas.
- O cabeçalho não aumenta de altura por causa da logo e o texto continua com ellipsis quando necessário.
- Link quebrado não reserva um espaço vazio permanente.

## Supabase

- Migração `029_logo_storage_upload_v340.sql`.
- Bucket público `quiz-logos` para leitura das imagens.
- INSERT/UPDATE/DELETE no bucket restritos a administradores autenticados via RLS.

---

# QuizRounds v3.38 — Lobbys integrados e Cidade Viva ampliada

A v3.38 preserva o fluxo de criação, jogo, ranking e estatísticas da v3.37 e refatora a experiência antes da partida nos três pontos do sistema: **ADM, jogador e telão**.

## Lobby do telão

- Telão fixo em `100vh/100dvh`, sem scroll horizontal.
- Header do lobby reduzido para uma única faixa compacta.
- PIN e QR Code em grid lado a lado no desktop.
- **Cidade Viva corrigida estruturalmente**: o mapa agora é uma faixa real independente da área de PIN/QR, usando integralmente o espaço reservado no grid do telão.
- Modos `Completo`, `Mapa em destaque` e `Automático`.
- No automático, o mapa ganha prioridade quando a sala atinge o limiar de prontidão/conexão.
- QR reduz discretamente quando a maior parte dos jogadores já entrou.
- Contadores animam apenas quando o valor muda.
- Status `PRONTO PARA COMEÇAR` considera jogadores prontos e conectados.
- Mensagem personalizada e horário previsto para início.
- Música ambiente sintetizada opcional; a nota ativa termina em fade-out natural ao iniciar o quiz.
- `3 → 2 → 1 → VAMOS!` e escurecimento suave do mapa antes da primeira/Próxima pergunta.

## Cidade Viva / mapa

- Cinco níveis de profundidade para distribuir os avatares.
- Escala dos personagens varia conforme a profundidade.
- Nomes adaptativos: permanecem limpos em salas grandes e aparecem em entradas/destaques/interações.
- Feedback localizado `+ Nome entrou` para novos jogadores.
- Jogadores prontos recebem indicação visual discreta.
- Modo de desempenho automático: normal, 40+ jogadores e 80+ jogadores.
- Cenários: **Cidade, Praia, Fazenda, Montanha, Laboratório e Plataforma**.
- No modo automático, o título/mensagem do evento ajuda a escolher cenários relacionados ao tema.

## Lobby do jogador

- Tela dedicada com avatar, nome, sala, mensagem do evento e horário previsto.
- Botão explícito **Estou pronto**.
- Jogador novo entra como `Aguardando` e só fica pronto após confirmar.
- A escolha de prontidão é preservada após F5/reconexão.
- Vibração para entrada, prontidão, reconexão e início da pergunta em dispositivos compatíveis.
- Reconexão automática continua preservada.

## Lobby do ADM

- Contadores separados de cadastrados, conectados, prontos, respostas, pendentes e participação.
- Controle do layout do telão: `Completo | Mapa | Automático`.
- Configurações de mensagem, horário previsto, cenário, limiar de prontidão e música ambiente.
- Filtros compactos de participantes: `Todos | Online | Offline | Prontos | Problemas`.
- Ranking e Participantes voltaram a usar meia largura no desktop, eliminando cards estreitos.
- Botão **Voltar à preparação** permanece disponível antes do início.

## Supabase

As alterações necessárias já foram aplicadas ao projeto atual e também acompanham o pacote:

- `027_lobby_readiness_experience_v338.sql`
- `028_explicit_player_ready_v338.sql`

As RPCs administrativas/jogador tocadas nesta versão continuam `SECURITY DEFINER`, sem `EXECUTE` para `anon` e com acesso explícito para `authenticated` quando necessário.

## Publicação

Substitua o conteúdo publicado pela pasta completa desta versão. Não misture assets de versões anteriores. Depois da publicação, faça um recarregamento sem cache no ADM/telão e reabra a aba do jogador.

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

# Motor do jogo MD5

Este documento explica como o MD5 transforma um draft de cinco campeões em uma
campanha completa, com cartas acumuladas, adversários competitivos, partidas
simuladas minuto a minuto e séries melhor de cinco.

## 1. Visão geral

O motor trabalha em cinco etapas:

1. O jogador escolhe um campeão para cada posição.
2. O draft recebe métricas, arquétipo, nota e avisos.
3. Um adversário é gerado de acordo com a fase, a dificuldade e as fraquezas do
   jogador.
4. As cartas ativas modificam os dois drafts, a nota e as regras da partida.
5. O motor calcula o resultado competitivo e cria a transmissão minuto a minuto.

O resultado não depende de uma única nota. Ele combina qualidade do draft,
encaixe nas posições, confronto entre arquétipos, adaptação do adversário,
pressão da fase, cartas e uma parcela controlada de aleatoriedade.

## 2. Arquivos principais

| Arquivo | Responsabilidade |
| --- | --- |
| `src/engine/roleEngine.ts` | Avalia se cada campeão funciona na posição escolhida. |
| `src/engine/synergyEngine.ts` | Calcula métricas, arquétipo, nota, pontos fortes e limitações do draft. |
| `src/engine/competitiveEnemyEngine.ts` | Monta o adversário e seu draft competitivo. |
| `src/engine/rogueCardEngine.ts` | Sorteia cartas e aplica seus efeitos. |
| `src/engine/simulationEngine.ts` | Controla campanha, fases, séries e probabilidade de vitória. |
| `src/engine/liveMatchEngine.ts` | Gera duração, eventos, ouro, objetivos e estruturas minuto a minuto. |
| `src/engine/diagnosisEngine.ts` | Produz o diagnóstico final da campanha. |
| `src/types/game.ts` | Define os contratos de dados usados por todo o motor. |

## 3. Avaliação do draft

### 3.1 Encaixe por posição

`calculateRoleFit` compara a posição escolhida com:

- posições naturais e alternativas do campeão;
- classe e estilo de jogo;
- atributos importantes para a função;
- dificuldade selecionada.

O resultado possui uma nota de 0 a 100 e um nível:

- `Natural`;
- `Flex`;
- `OffMeta`;
- `Bad`;
- `Terrible`.

Escolhas fora de posição reduzem especialmente pressão inicial, controle de
objetivos, consistência e nota total.

### 3.2 Métricas da equipe

`calculateTeamScore` consolida os campeões nas seguintes métricas:

- dano físico e mágico;
- frontline;
- engage e peel;
- controle de grupo;
- scaling e early game;
- controle de objetivos;
- team fight, pickoff, split push e wave clear;
- encaixe nas posições;
- sinergia com cartas;
- adaptação às regras;
- consistência;
- dificuldade de execução.

As métricas são normalizadas para o intervalo de 0 a 100.

### 3.3 Arquétipo

O motor calcula uma pontuação para cada plano estratégico e escolhe o maior:

- Team Fight;
- Pickoff;
- Split Push;
- Poke;
- Protect the Carry;
- Early Snowball;
- Scaling;
- Balanced.

Por exemplo, Team Fight valoriza luta em equipe, controle de grupo, engage e
frontline. Scaling valoriza poder tardio, wave clear, proteção e team fight.

### 3.4 Nota total

A nota bruta usa uma soma ponderada. Os maiores pesos são:

- encaixe nas posições: 17%;
- força dos campeões em suas funções: 13%;
- sinergia com cartas: 11%;
- clareza da condição de vitória: 10%;
- adaptação às regras e equilíbrio de dano: 8% cada.

Frontline, plano alternativo, peel, objetivos e wave clear completam a conta.
Um bônus pequeno de sinergia pode elevar ou reduzir o resultado.

### 3.5 Tetos de nota

Uma composição pode ter bons números e ainda possuir um problema estrutural.
Por isso `calculateDraftScoreCap` limita a nota quando encontra situações como:

- ausência de dano confiável;
- condição de vitória pouco clara;
- três ou mais campeões fora de posição;
- dano quase totalmente físico ou mágico;
- falta de frontline sem plano alternativo;
- time frágil sem engage ou proteção;
- wave clear insuficiente;
- Jungle sem controle de objetivos.

A nota exibida é o menor valor entre a nota bruta e o teto aplicável.

## 4. Geração do adversário

`generateCounterMetaEnemy` recebe a nota do jogador, a fase, a dificuldade e as
organizações já usadas.

O processo:

1. Escolhe uma organização compatível com a força esperada da fase.
2. Seleciona um modelo de composição competitivo.
3. Sorteia campeões com pesos de meta e adequação por posição.
4. Evita campeões repetidos e valida as cinco funções.
5. Mede coerência, adaptação às regras e qualidade geral.
6. Cria um perfil de punição para as fraquezas do jogador.

O perfil pode explorar falta de frontline, peel, engage, wave clear, scaling ou
um perfil de dano previsível. Fases avançadas usam adversários mais fortes e
adaptáveis.

## 5. Sistema de cartas

### 5.1 Sorteio

Três cartas diferentes são oferecidas. Cartas já escolhidas e cartas removidas
por um Refresh não voltam imediatamente para a seleção.

As raridades usam pesos:

- Common: 46;
- Rare: 32;
- Epic: 17;
- Legendary: 5.

Isso significa que cartas lendárias são possíveis, mas aparecem com menor
frequência.

### 5.2 Quando uma carta é escolhida

- Fase de grupos: uma carta antes de cada partida.
- Quartas, semifinal e final: uma carta antes do primeiro jogo da série MD5.
- A mesma carta permanece durante todos os jogos daquela MD5.
- Ao avançar para a próxima MD5, uma nova carta é escolhida.

As cartas continuam acumuladas na campanha. O que não acontece dentro de uma
MD5 é adicionar uma carta nova a cada jogo.

### 5.3 Aplicação dos efeitos

Cada carta possui alvo, momento, operação, valor e condição opcional. Os efeitos
podem alterar:

- atributos dos campeões;
- métricas e nota do time;
- qualidade do adversário;
- duração e variância;
- frequência e valor de lutas;
- dragões, Barão e roubos de objetivo;
- resistência de torres, inibidores e Nexus;
- snowball, comeback e momentum;
- tetos de pontuação.

O motor recalcula o draft modificado antes de preparar a partida. Cartas com
condições só atuam quando a posição, classe, fase ou perfil de dano corresponde
à regra.

## 6. Cálculo da partida competitiva

`simulateCompetitiveGame` calcula primeiro a qualidade dos dois lados.

Qualidade do jogador:

- 56% da nota total;
- 11% da sinergia com cartas;
- 9% da adaptação às regras;
- 8% da consistência;
- 7% do encaixe nas posições;
- 6% do melhor valor entre engage, peel e objetivos;
- 3% do menor valor entre dano físico e mágico.

Qualidade do adversário:

- 43% da dificuldade;
- 17% da força de meta;
- 20% da coerência do draft;
- 15% da adaptação às regras;
- bônus de controle de objetivos.

A chance parte de 50% e recebe:

- diferença entre as qualidades;
- vantagem ou desvantagem entre arquétipos;
- punição das fraquezas do jogador;
- penalidade de consistência em séries;
- adaptação do adversário entre jogos da MD5;
- bônus de classificação nos grupos;
- pressão da fase no modo Difícil;
- momentum da série;
- variância aleatória controlada.

O valor final é limitado entre 4% e 96%. Assim, nenhum lado possui vitória
absolutamente garantida.

## 7. Confronto entre arquétipos

`matchupMatrix` representa relações estratégicas. Alguns exemplos:

- Team Fight tem vantagem contra Pickoff, mas sofre contra Poke.
- Pickoff pune Scaling e Protect the Carry.
- Split Push pode pressionar Team Fight.
- Early Snowball é forte contra Scaling.
- Scaling sofre quando não consegue sobreviver ao início.

Essa matriz não decide sozinha; ela apenas adiciona ou remove alguns pontos da
chance calculada.

## 8. Estrutura da campanha

`RogueCampaignState` guarda:

- draft e dificuldade;
- nota base e nota modificada;
- cartas ativas;
- séries concluídas;
- adversário e fase atual;
- jogos e placar da série;
- número global da partida;
- eliminação ou título.

### 8.1 Grupos

São disputadas três partidas independentes. Cada partida conta como uma série
de jogo único. O jogador precisa vencer pelo menos duas para avançar.

### 8.2 Eliminatórias

Quartas, semifinal e final são MD5. A série termina quando um lado chega a três
vitórias. Se o jogador vence, um novo adversário é criado para a próxima fase.
Se perde, a campanha termina na fase atual.

### 8.3 Estado incremental

A campanha prepara e avança uma partida por vez:

1. `prepareRogueCampaignMatch` aplica a carta e simula o próximo jogo.
2. A interface apresenta a transmissão.
3. `advanceRogueCampaignState` registra o resultado.
4. O estado decide se continua a série, pede outra carta, muda de fase ou
   encerra a campanha.

## 9. Simulação ao vivo

O vencedor competitivo é definido antes da transmissão. A simulação ao vivo
constrói uma partida coerente com esse resultado, sem simplesmente exibir um
número pronto.

### 9.1 Duração

A duração profissional considera:

- early game e scaling;
- força e estilo do adversário;
- fase do torneio;
- cartas que aceleram ou atrasam a partida.

O resultado fica normalmente entre 18 e 55 minutos de jogo simulado.

### 9.2 Eventos

A cada minuto, `generateMinuteEvents` pode criar:

- first blood, abates, assistências e mortes;
- lutas em equipe e ace;
- dragões, Arauto, Barão e roubos;
- torres e inibidores;
- pressão de mapa e picos de poder;
- encerramento da partida.

As chances mudam conforme minuto, ouro, composição, adversário e cartas.

### 9.3 Estruturas

O motor mantém três torres e um inibidor por rota para cada lado. Um inibidor
só pode cair depois que todas as torres daquela rota forem destruídas. O Nexus
só pode ser destruído quando existe uma rota aberta.

### 9.4 Ouro e objetivos

Cada evento atualiza o estado:

- abates aumentam placar e ouro;
- objetivos concedem ouro e pressão;
- Barão aumenta a chance de derrubar estruturas;
- torres e inibidores respeitam os limites do mapa;
- cartas podem multiplicar os valores.

Ao final, o motor garante que o lado vencedor possui uma sequência válida para
destruir o Nexus.

## 10. Modos e velocidades

O modo Manual pausa entre partidas. O Automático avança depois do resumo.

Os limites reais de exibição são:

| Velocidade | Tempo máximo aproximado |
| --- | ---: |
| Devagar | 20 segundos |
| Normal | 10 segundos |
| Rápida | 5 segundos |
| Ultra rápida | 2 segundos |

`calculateMatchTickMs` divide esse orçamento pela duração simulada da partida.
Partidas longas avançam mais minutos por intervalo para respeitar o limite.

## 11. Resultado final

`getCampaignResult` reúne:

- vitórias e derrotas;
- campanha perfeita;
- fase de eliminação;
- desempenho nos grupos;
- séries e partidas;
- nota final;
- cartas acumuladas.

`generateFinalDiagnosis` transforma esses dados em um texto explicando o
resultado da campanha.

## 12. Aleatoriedade e repetibilidade

O motor usa `Math.random()` para sorteios, adversários, eventos e variância.
Portanto, duas campanhas com o mesmo draft podem terminar de formas diferentes.

Os testes verificam contratos e limites, não um placar exato. Para reproduzir
uma campanha de forma determinística no futuro, seria necessário introduzir um
gerador de números pseudoaleatórios com seed.

## 13. Como alterar o balanceamento

- Pesos da nota: `calculateTeamScore` em `synergyEngine.ts`.
- Tetos e problemas estruturais: `calculateDraftScoreCap`.
- Relações entre arquétipos: `matchupMatrix` em `simulationEngine.ts`.
- Pressão por fase e dificuldade: `groupQualificationBonus` e
  `knockoutPressure`.
- Cartas e seus efeitos: `src/data/rogueCards.ts`.
- Raridades: `rarityWeight` em `rogueCardEngine.ts`.
- Eventos e objetivos: `generateMinuteEvents` em `liveMatchEngine.ts`.
- Velocidades: `matchSimulationTimeBudgetMs`.

Depois de qualquer mudança de balanceamento, execute:

```bash
npm test
npm run build
```


# MD5

Fan project de draft, cartas roguelike e torneio competitivo inspirado no
universo de League of Legends.

O jogo combina draft, regras acumuladas, adversários guiados por meta e uma
transmissão visual de toda a campanha, da fase de grupos à Final MD5.

## Documentação do motor

O funcionamento completo da nota, adversários, cartas, séries e simulação ao
vivo está explicado em [docs/MOTOR_DO_JOGO.md](docs/MOTOR_DO_JOGO.md).

## Desenvolvimento

```bash
npm install
npm run dev
```

## Testes e build

```bash
npm test
npm run build
```

O projeto está pronto para Vercel com `dist` como diretório de saída.

## Simulação ao vivo

A transmissão usa um mini mapa dinâmico para representar lutas, objetivos,
pressão de rota e estruturas. No modo Manual, cada partida roda até o fim e
aguarda o usuário antes do jogo seguinte. No Automático, o torneio avança sozinho.

As velocidades usam um orçamento por partida: Devagar (20s), Normal (10s),
Rápida (5s) e Ultra rápida (2s). O tick visual é recalculado conforme a
duração de cada jogo.

O mini mapa ocupa um painel lateral compacto no desktop e passa para baixo das
informações em telas menores.

## Nota do draft

A avaliação combina encaixe nas posições, coerência do draft, adaptação às
cartas, perfil de dano e clareza da condição de vitória. Erros estruturais aplicam
tetos de nota explicáveis, evitando que atributos irrelevantes escondam um
campeão fora de posição, uma Jungle incoerente ou uma composição sem plano claro.

## Ícones dos itens

Os 102 SVGs fictícios ficam em `public/assets/items`. Para regenerá-los:

```bash
npm run generate:item-icons
```

## Atualizar campeões

```bash
npm run sync:champions
```

O script consulta a versão mais recente do Data Dragon e atualiza o catálogo
local em `src/data/champions/generatedChampions.ts`. Se a rede falhar, o arquivo
existente permanece intacto.

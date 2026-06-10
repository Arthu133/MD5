# MD5

Fan project de draft e torneio competitivo inspirado no universo de League of
Legends.

O jogo combina draft, itemização, adversários guiados por meta e uma transmissão
visual de toda a campanha, da fase de grupos à Final MD5.

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

As velocidades usam um orçamento por partida: Devagar (45s), Normal (25s),
Rápida (15s) e Ultra rápida (10s). O tick visual é recalculado conforme a
duração de cada jogo.

O mini mapa ocupa um painel lateral compacto no desktop e passa para baixo das
informações em telas menores.

## Nota do draft

A avaliação combina encaixe nas posições, itemização, coerência das builds,
perfil de dano e clareza da condição de vitória. Erros estruturais aplicam
tetos de nota explicáveis, evitando que atributos irrelevantes escondam um
Carry mal itemizado, uma Jungle incoerente ou uma composição sem plano claro.

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

# MD5

Jogo de estratégia e draft inspirado no cenário competitivo de League of
Legends. Monte uma composição, escolha regras roguelike e dispute uma campanha
com fase de grupos e séries melhor de cinco.

## Jogue online

- [playmd5.xyz](https://playmd5.xyz/)

## Como funciona

1. Escolha entre os modos **Clássico** e **Difícil**.
2. Monte um time com Top, Jungle, Mid, Carry e Support.
3. Para cada posição, escolha um entre 10 campeões exibidos em um grid 5x2.
4. Analise a composição, os pontos fortes e a condição de vitória do draft.
5. Antes das partidas, escolha uma entre três cartas de regra.
6. Enfrente adversários gerados de acordo com a fase, o meta e as fraquezas da
   sua composição.
7. Vença a fase de grupos e avance por quartas, semifinal e Final MD5.

## Principais recursos

- Draft com campeões e imagens do Data Dragon.
- Avaliação de encaixe por posição, sinergia, dano, frontline, engage, peel,
  scaling, objetivos e outras características estratégicas.
- Arquétipos como Team Fight, Pickoff, Split Push, Poke, Early Snowball e
  Scaling.
- Cartas roguelike de diferentes raridades que alteram atributos, objetivos,
  estruturas, ritmo e regras das partidas.
- Comparação visual entre o seu draft e o draft adversário.
- Adversários competitivos que se adaptam à fase e à dificuldade.
- Partidas simuladas minuto a minuto, com ouro, abates, objetivos, estruturas e
  mini mapa.
- Fase de grupos seguida por quartas, semifinal e final em séries MD5.
- Interface responsiva para desktop e dispositivos menores.

## Cartas e campanha

Na fase de grupos, uma carta é escolhida antes de cada partida. Nas fases
eliminatórias, a carta escolhida antes da série permanece ativa até o fim
daquela MD5. Ao avançar para uma nova série, uma nova carta é oferecida.

As cartas acumuladas podem modificar a composição, a duração das partidas, o
valor dos objetivos, o snowball, o comeback e outros aspectos da simulação.

## Modos de dificuldade

### Clássico

- Exibe mais informações estratégicas e os efeitos detalhados das cartas.
- Disponibiliza três atualizações de opções durante o draft.

### Difícil

- Oculta parte dos números e exige mais leitura do confronto.
- Disponibiliza uma atualização de opções durante o draft.
- Usa adversários e condições mais exigentes.

## Simulação

O torneio pode avançar automaticamente ou aguardar confirmação manual entre as
partidas. A velocidade da transmissão pode ser alterada durante o jogo:

| Velocidade | Duração aproximada por partida |
| --- | ---: |
| Ultra rápida | 2 segundos |
| Rápida | 5 segundos |
| Normal | 10 segundos |
| Devagar | 1 minuto |

## Executando localmente

### Requisitos

- Node.js
- npm

### Instalação

```bash
git clone https://github.com/Arthu133/MD5.git
cd MD5
npm install
npm run dev
```

O Vite exibirá no terminal o endereço local da aplicação.

### Testes e build

```bash
npm test
npm run build
npm run preview
```

O build de produção é gerado em `dist/`. O projeto inclui configuração para
deploy na Vercel.

## Tecnologias

- React 19
- TypeScript
- Vite
- Vitest
- Data Dragon
- Vercel

## Estrutura do projeto

```text
src/components   Componentes da interface
src/data         Campeões, cartas, itens e dados competitivos
src/engine       Draft, pontuação, adversários, campanha e simulação
src/types        Tipos compartilhados
scripts          Sincronização e ferramentas auxiliares
docs             Documentação técnica
```

Uma descrição detalhada dos cálculos e sistemas está disponível em
[docs/MOTOR_DO_JOGO.md](docs/MOTOR_DO_JOGO.md).

## Atualização dos dados

Para sincronizar o catálogo de campeões com o Data Dragon:

```bash
npm run sync:champions
```

Para regenerar os ícones fictícios dos itens:

```bash
npm run generate:item-icons
```

## Contribuindo

Contribuições são bem-vindas. Para propor uma alteração:

1. Faça um fork do repositório.
2. Crie uma branch para sua mudança.
3. Execute `npm test` e `npm run build`.
4. Abra um pull request explicando o problema e a solução.

Ao contribuir, mantenha mudanças de interface, balanceamento e motor bem
separadas sempre que possível.

## Aviso legal

MD5 é um fan project independente e não é endossado pela Riot Games. League of
Legends e suas propriedades associadas pertencem à Riot Games.

import type { CSSProperties } from 'react';
import { petals } from '../../lib/sakura';

// Uma pétala de sakura: gota com o entalhe na ponta, que é o que a distingue.
const PETAL_PATH = 'M0 0C-15-12-19-31-8-43L0-36 8-43C19-31 15-12 0 0Z';
const FIVE = [0, 72, 144, 216, 288];

/** Onde cada flor fica no galho, da base para a ponta: x, y, tamanho e rotação. */
const blossoms: [number, number, number, number][] = [
  [30, 78, 0.4, 320],
  [58, 46, 0.5, 10],
  [84, 96, 0.36, 150],
  [96, 30, 0.42, 40],
  [118, 74, 0.56, 200],
  [150, 44, 0.4, 130],
  [176, 104, 0.52, 60],
  [214, 82, 0.44, 300],
  [236, 136, 0.5, 20],
  [262, 172, 0.4, 100],
  [288, 132, 0.46, 250],
  [322, 150, 0.52, 170],
  [352, 128, 0.38, 80],
];

/** Botões ainda fechados, nas pontas dos ramos. */
const buds: [number, number][] = [
  [196, 34],
  [282, 190],
  [372, 150],
  [136, 20],
  [72, 118],
];

/** Faixas de névoa que cruzam o céu: altura, tamanho, ritmo e ponto de partida. */
const clouds = [
  { top: 5, size: 1, pace: 1, offset: 0.15 },
  { top: 15, size: 0.7, pace: 1.35, offset: 0.6 },
  { top: 24, size: 0.85, pace: 1.15, offset: 0.85 },
];

const vars = (values: Record<string, string | number>) => values as CSSProperties;

/**
 * Galho que afina, com quebras angulosas e sem folhas: a sakura floresce antes
 * delas. Desenhado direto no SVG (e não por `<use>`) para cada flor poder
 * tremer por conta própria quando o vento passa.
 */
function Branch() {
  return (
    <svg className="sakura-branch" viewBox="0 0 400 220" focusable="false">
      <path className="sakura-wood" strokeWidth="11" d="M-12 34L46 50 104 62" />
      <path className="sakura-wood" strokeWidth="8" d="M104 62L160 96 206 110" />
      <path className="sakura-wood" strokeWidth="5.5" d="M206 110L256 150 312 148" />
      <path className="sakura-wood" strokeWidth="3.5" d="M312 148L348 132 376 146" />
      <path className="sakura-wood" strokeWidth="5" d="M104 62L128 34 164 40" />
      <path className="sakura-wood" strokeWidth="3" d="M164 40L196 30" />
      <path className="sakura-wood" strokeWidth="4" d="M206 110L226 132 258 170" />
      <path className="sakura-wood" strokeWidth="2.5" d="M258 170L284 192" />
      <path className="sakura-wood" strokeWidth="4" d="M46 50L34 76 72 112" />
      <path className="sakura-wood" strokeWidth="2.5" d="M128 34L136 16" />
      {buds.map(([x, y]) => (
        <circle key={`${x}-${y}`} className="sakura-bud" cx={x} cy={y} r="5" />
      ))}
      {blossoms.map(([x, y, scale, turn], index) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          {/* O vento chega primeiro na base: cada flor treme um pouco depois da anterior. */}
          <g className="sakura-flower" style={vars({ '--i': index })}>
            <use
              href="#sakura-blossom"
              x="-50"
              y="-50"
              width="100"
              height="100"
              transform={`scale(${scale}) rotate(${turn})`}
            />
          </g>
        </g>
      ))}
    </svg>
  );
}

/**
 * Cenário decorativo da home: céu, sol e lua, névoa, dois galhos floridos e
 * pétalas caindo. Tudo em SVG e CSS, pintado pelos tokens `--color-scene-*`,
 * então acompanha o tema sem código próprio. Composição assimétrica, com o
 * centro livre para os personagens, e cores chapadas, como em xilogravura.
 */
export function SakuraScene() {
  return (
    <div className="sakura" aria-hidden="true">
      <svg className="sakura-defs" focusable="false">
        <defs>
          <symbol id="sakura-petal" viewBox="-22 -46 44 48" overflow="visible">
            <path d={PETAL_PATH} />
          </symbol>
          <symbol id="sakura-blossom" viewBox="-50 -50 100 100" overflow="visible">
            {FIVE.map((angle) => (
              <path
                key={angle}
                className="sakura-blossom-petal"
                d={PETAL_PATH}
                transform={`rotate(${angle})`}
              />
            ))}
            {FIVE.map((angle) => (
              <path
                key={angle}
                className="sakura-stamen"
                d="M0 0V-15"
                transform={`rotate(${angle + 36})`}
              />
            ))}
            <circle className="sakura-core" r="4.5" />
          </symbol>
          {/* Névoa em faixas arredondadas e empilhadas, como nas gravuras. */}
          <symbol id="sakura-cloud" viewBox="0 0 220 54">
            <rect x="40" y="0" width="120" height="18" rx="9" />
            <rect x="0" y="18" width="180" height="18" rx="9" />
            <rect x="70" y="36" width="150" height="18" rx="9" />
          </symbol>
        </defs>
      </svg>

      {/* Sol e lua ocupam o mesmo lugar; o tema decide qual está no céu. */}
      <div className="sakura-sky">
        <div className="sakura-orb sakura-sun" />
        <div className="sakura-orb sakura-moon" />
      </div>

      {clouds.map((cloud) => (
        <svg
          key={cloud.top}
          className="sakura-cloud"
          viewBox="0 0 220 54"
          focusable="false"
          style={vars({
            '--top': `${cloud.top}%`,
            '--size': cloud.size,
            '--pace': cloud.pace,
            '--offset': cloud.offset,
          })}
        >
          <use href="#sakura-cloud" />
        </svg>
      ))}

      <div className="sakura-bough sakura-bough-left">
        <Branch />
      </div>
      <div className="sakura-bough sakura-bough-right">
        <Branch />
      </div>

      <div className="sakura-petals">
        {petals.map((petal, index) => (
          <svg
            key={index}
            className="sakura-petal"
            viewBox="-22 -46 44 48"
            focusable="false"
            style={vars({
              '--x': `${petal.x}%`,
              '--y': `${petal.y}%`,
              '--size': petal.size,
              '--depth': petal.depth,
              '--pace': petal.pace,
              '--offset': petal.offset,
              '--sway': `${petal.sway}rem`,
              '--turn': `${petal.turn}deg`,
            })}
          >
            <use href="#sakura-petal" />
          </svg>
        ))}
      </div>
    </div>
  );
}

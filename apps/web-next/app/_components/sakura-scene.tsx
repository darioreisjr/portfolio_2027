import type { CSSProperties } from 'react';
import { petals } from '../../lib/sakura';

// Uma pétala de sakura: gota com o entalhe na ponta, que é o que a distingue.
const PETAL_PATH = 'M0 0C-15-12-19-31-8-43L0-36 8-43C19-31 15-12 0 0Z';
const FIVE = [0, 72, 144, 216, 288];

/** Onde cada flor fica no galho: x, y, tamanho e rotação. */
const blossoms: [number, number, number, number][] = [
  [58, 46, 0.5, 10],
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
  [30, 78, 0.4, 320],
  [84, 96, 0.36, 150],
];

/** Botões ainda fechados, nas pontas dos ramos. */
const buds: [number, number][] = [
  [196, 34],
  [282, 190],
  [372, 150],
  [136, 20],
  [72, 118],
];

/**
 * Cenário decorativo da home: céu, astro, dois galhos floridos e pétalas caindo.
 * Tudo em SVG e CSS, pintado pelos tokens `--color-scene-*`, então acompanha o
 * tema sem código próprio. Composição assimétrica, com o centro livre para os
 * personagens, e cores chapadas, como em xilogravura.
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
          <symbol id="sakura-branch" viewBox="0 0 400 220" overflow="visible">
            {/* Galho que afina, com quebras angulosas; sem folhas: a sakura floresce antes delas. */}
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
            {blossoms.map(([x, y, scale, turn]) => (
              <use
                key={`${x}-${y}`}
                href="#sakura-blossom"
                x="-50"
                y="-50"
                width="100"
                height="100"
                transform={`translate(${x} ${y}) scale(${scale}) rotate(${turn})`}
              />
            ))}
          </symbol>
        </defs>
      </svg>

      <div className="sakura-orb" />

      <svg className="sakura-branch sakura-branch-left" viewBox="0 0 400 220" focusable="false">
        <use href="#sakura-branch" />
      </svg>
      <svg className="sakura-branch sakura-branch-right" viewBox="0 0 400 220" focusable="false">
        <use href="#sakura-branch" />
      </svg>

      <div className="sakura-petals">
        {petals.map((petal, index) => (
          <svg
            key={index}
            className="sakura-petal"
            viewBox="-22 -46 44 48"
            focusable="false"
            style={
              {
                '--x': `${petal.x}%`,
                '--y': `${petal.y}%`,
                '--size': petal.size,
                '--depth': petal.depth,
                '--pace': petal.pace,
                '--offset': petal.offset,
                '--sway': `${petal.sway}rem`,
                '--turn': `${petal.turn}deg`,
              } as CSSProperties
            }
          >
            <use href="#sakura-petal" />
          </svg>
        ))}
      </div>
    </div>
  );
}

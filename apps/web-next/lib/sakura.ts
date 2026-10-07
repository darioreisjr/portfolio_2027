/** Uma pétala do cenário. Só números: as cores vêm dos tokens, pelo CSS. */
export interface Petal {
  /** Posição horizontal, em % da largura da cena. */
  x: number;
  /** Altura em que fica parada quando o movimento está reduzido, em % da cena. */
  y: number;
  /** Tamanho relativo (1 = pétala padrão). */
  size: number;
  /** Opacidade: pétalas menores e mais transparentes parecem mais distantes. */
  depth: number;
  /** Quanto a queda demora, em relação à duração padrão do token. */
  pace: number;
  /** Fração do ciclo já percorrida na carga, para a tela não começar vazia. */
  offset: number;
  /** Amplitude do balanço lateral, em rem; o sinal alterna a direção. */
  sway: number;
  /** Rotação inicial, em graus. */
  turn: number;
}

export const PETAL_COUNT = 20;

// Sequências de baixa discrepância: espalham bem sem repetir e sem sorteio, o
// que mantém o HTML idêntico entre builds e entre servidor e navegador.
const spread = (index: number, step: number) => (index * step) % 1;
const round = (value: number, digits = 2) => Number(value.toFixed(digits));

export const petals: Petal[] = Array.from({ length: PETAL_COUNT }, (_, index) => {
  const near = spread(index, 0.7548776662);

  return {
    x: round(2 + spread(index, 0.6180339887) * 96, 1),
    y: round(6 + spread(index, 0.569840291) * 84, 1),
    size: round(0.6 + near * 0.7),
    depth: round(0.5 + near * 0.45),
    // As mais próximas (maiores) caem mais rápido.
    pace: round(1.25 - near * 0.5),
    offset: round(spread(index, 0.4142135624)),
    sway: round((index % 2 === 0 ? 1 : -1) * (1.5 + spread(index, 0.3247179572) * 2.5)),
    turn: Math.round(spread(index, 0.2360679775) * 360),
  };
});

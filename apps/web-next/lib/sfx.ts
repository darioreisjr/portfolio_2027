// Efeitos sonoros da home: notas de corda dedilhada, sintetizadas no navegador
// (sem arquivo), na escala In japonesa. Seguem o botão de som do canto: com ele
// desligado não há som nem `AudioContext`. Importado só por componentes que
// `persona-list.tsx` carrega, para sair no mesmo arquivo de script
// (docs/plans/home-efeitos.md).

/** Passar por um personagem; `index` escolhe a nota dele. */
export const HOVER = 0;
/** Passar por "Entrar" ou "Voltar". */
export const OPTION = 1;
/** Escolher um personagem; `index` escolhe a nota dele. */
export const PICK = 2;
/** Clicar em "Entrar". */
export const ENTER = 3;
/** Desfazer a escolha. */
export const CANCEL = 4;
/** Ligar o som. */
export const ON = 5;

/** Frequência em Hz, atraso em s, pico do ganho e duração em s. */
export type Note = [frequency: number, delay: number, peak: number, duration: number];

// Tudo é contado em semitons a partir desta nota (Ré 4): transpor é trocar o número.
const ROOT = 293.6648;
const hz = (semitone: number) => ROOT * 2 ** (semitone / 12);
// Uma nota por personagem, subindo: Lá, Si bemol, Ré, Mi bemol.
const PERSONA = [7, 8, 12, 13];

/** As notas de cada efeito. Pura, para o teste conferir sem tocar nada. */
export function notesFor(kind: number, index = 0): Note[] {
  const persona = hz(PERSONA[index] ?? 7);
  const sounds: Note[][] = [
    [[persona, 0, 0.5, 0.22]],
    [[hz(17), 0, 0.4, 0.18]],
    // Confirmar: a nota do personagem e a oitava acima.
    [
      [persona, 0, 0.8, 0.4],
      [persona * 2, 0.07, 0.8, 0.4],
    ],
    [
      [hz(12), 0, 0.8, 0.4],
      [hz(17), 0.06, 0.8, 0.4],
      [hz(24), 0.12, 0.8, 0.4],
    ],
    // Cancelar: grave, descendo meio tom.
    [
      [hz(1), 0, 0.7, 0.45],
      [hz(0), 0.08, 0.7, 0.45],
    ],
    [[hz(19), 0, 0.6, 0.3]],
  ];
  return sounds[kind] ?? [];
}

let on = false;
let context: AudioContext | undefined;
let master: GainNode | undefined;
let lastAt = 0;

/** Só o botão de som escreve aqui. */
export function setSound(value: boolean): void {
  on = value;
}

/**
 * Cria ou acorda o contexto de áudio. Só pode ser chamado dentro de um gesto
 * (clique ou tecla): fora dele o navegador recusa e avisa no console.
 */
export function unlock(): void {
  if (!on || !window.AudioContext) return;
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    // Baixo: os efeitos somam com a música, que já é de fundo.
    master.gain.value = 0.15;
    master.connect(context.destination);
  }
  if (context.state !== 'running') context.resume().catch(() => {});
}

/** Toca um efeito. Mudo com o som desligado ou antes do primeiro gesto. */
export function sfx(kind: number, index?: number): void {
  if (!on || !context || !master) return;
  // Passar por cima não acorda nada nem empilha: num contexto parado as notas
  // tocariam todas juntas depois, e varrer os personagens depressa viraria ruído.
  const at = performance.now();
  if (kind < PICK) {
    if (context.state !== 'running' || at - lastAt < 30) return;
    lastAt = at;
  } else {
    // Escolher e desfazer mudam os personagens de lugar, e o navegador avisa que
    // o ponteiro "entrou" em quem foi parar embaixo dele. Por um instante, isso
    // não conta como passar o mouse.
    lastAt = at + 250;
  }
  const now = context.currentTime;

  for (const [frequency, delay, peak, duration] of notesFor(kind, index)) {
    const start = now + delay;
    const string = context.createOscillator();
    string.type = 'sawtooth';
    string.frequency.value = frequency;
    // O "puxão" da corda: começa um pouco acima da nota.
    string.detune.setValueAtTime(20, start);
    string.detune.linearRampToValueAtTime(0, start + 0.05);
    // Brilho no ataque, que some depressa, como em corda dedilhada.
    const tone = context.createBiquadFilter();
    tone.frequency.setValueAtTime(frequency * 6, start);
    tone.frequency.exponentialRampToValueAtTime(frequency * 1.5, start + 0.12);
    const pluck = context.createGain();
    pluck.gain.setValueAtTime(0, start);
    pluck.gain.linearRampToValueAtTime(peak, start + 0.004);
    pluck.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    string.connect(tone).connect(pluck).connect(master);
    string.start(start);
    string.stop(start + duration + 0.02);
  }
}

/** Ao sair da home: nenhuma nota nova, e o contexto fecha depois da última. */
export function closeSound(): void {
  on = false;
  const closing = context;
  context = master = undefined;
  if (closing) setTimeout(() => closing.close().catch(() => {}), 500);
}

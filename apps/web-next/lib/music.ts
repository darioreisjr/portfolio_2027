import { HOME_ASSETS_PATH } from '@portfolio/contracts';

/**
 * Guarda `on` quando o visitante ligou a música da home; ausente quando está
 * desligada, que é o padrão. Só este app lê a chave (ADR 0008).
 */
export const MUSIC_STORAGE_KEY = 'portfolio:musica';

/** Elemento do grupo do canto (no layout) onde o botão da música é posto. */
export const MUSIC_SLOT_ID = 'home-music-slot';

/**
 * Faixa de fundo da home. A versão no nome faz o papel do hash: o arquivo fica
 * em cache por um ano, e trocar a faixa é trocar o nome. Origem e licença em
 * docs/assets-de-terceiros.md.
 */
export const MUSIC_SRC = `${HOME_ASSETS_PATH}audio/petals-on-the-water.v2.mp3`;

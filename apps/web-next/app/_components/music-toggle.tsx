import { useEffect, useRef } from 'react';
import { MUSIC_STORAGE_KEY, MUSIC_TIME_KEY } from '../../lib/music';
import { ON, closeSound, setSound, sfx, unlock } from '../../lib/sfx';

/**
 * Botão de som da home (ADR 0008): liga a música de fundo e os efeitos de
 * seleção (`lib/sfx.ts`). Começa desligado, e o arquivo da música nunca é
 * pedido na primeira página de uma visita.
 *
 * O botão diz a verdade: `aria-pressed` só fica `true` com o som de fato ativo.
 * A escolha de quem ligou é lembrada à parte. Na visita seguinte o botão nasce
 * desligado e o som volta no primeiro gesto, porque o navegador não deixa tocar
 * antes. Na continuação da mesma aba (trocar de idioma, recarregar, voltar à
 * home) a página tenta retomar sozinha, do ponto onde a música estava.
 *
 * Sem estado do React nem nova renderização. Só é renderizado no navegador, por
 * `persona-list.tsx`: sem JavaScript o botão não existe, e o lugar dele no grupo
 * do canto fica guardado, vazio.
 */
export function MusicToggle({ label, src }: { label: string; src: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const audio = audioRef.current;
    if (!button || !audio) return;

    // `armed`: a pessoa quer som (escolha lembrada). `active`: há som agora.
    // Quem pediu para economizar dados não tem a escolha retomada sozinha.
    let armed = false;
    let active = false;
    // A faixa não pôde ser tocada: fica de fora, mas os efeitos seguem.
    let broken = false;
    let disposed = false;
    const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
    try {
      armed = !saveData && localStorage.getItem(MUSIC_STORAGE_KEY) === 'on';
    } catch {
      // Sem armazenamento, a escolha vale só para esta página.
    }

    const setActive = (on: boolean) => {
      active = on;
      button.setAttribute('aria-pressed', String(on));
      setSound(on);
    };
    const remember = (on: boolean) => {
      armed = on;
      try {
        if (on) localStorage.setItem(MUSIC_STORAGE_KEY, 'on');
        else localStorage.removeItem(MUSIC_STORAGE_KEY);
      } catch {
        // Sem armazenamento.
      }
    };
    // Marca da sessão: onde a música estava, para a próxima página desta aba
    // continuar dali. Só existe enquanto o som está ativo.
    const mark = (on: boolean) => {
      try {
        if (on) sessionStorage.setItem(MUSIC_TIME_KEY, String(audio.currentTime));
        else sessionStorage.removeItem(MUSIC_TIME_KEY);
      } catch {
        // Sem armazenamento, a próxima página espera o gesto.
      }
    };
    // Resolve `false` só quando o navegador recusa por falta de gesto. Arquivo
    // que não toca e pausa logo depois do pedido não são falta de permissão.
    const play = () => {
      if (broken) return Promise.resolve(true);
      if (!audio.getAttribute('src')) audio.src = src;
      return audio.play().then(
        () => true,
        (error: unknown) => {
          const { name } = error as DOMException;
          broken = name === 'NotSupportedError';
          return name !== 'NotAllowedError';
        },
      );
    };
    // Liga dentro de um gesto. Se ainda assim o navegador recusar (há teclas que
    // não contam como gesto), o botão volta a desligado e espera o próximo.
    const turnOn = () => {
      setActive(true);
      unlock();
      void play().then((allowed) => {
        if (!allowed && !disposed) setActive(false);
      });
    };

    // Continuação da mesma aba: tenta retomar sem gesto. O botão só liga se o
    // navegador de fato deixar tocar.
    try {
      const time = sessionStorage.getItem(MUSIC_TIME_KEY);
      if (armed && time !== null && !document.hidden) {
        audio.src = src;
        audio.currentTime = Number(time) || 0;
        audio.play().then(
          () => {
            if (disposed) return;
            setActive(true);
            unlock();
          },
          () => {},
        );
      }
    } catch {
      // Sem armazenamento, espera o gesto.
    }

    const onToggle = () => {
      if (active) {
        remember(false);
        mark(false);
        setActive(false);
        audio.pause();
      } else {
        remember(true);
        turnOn();
        // Uma nota ao ligar: confirma que o som está funcionando.
        sfx(ON);
      }
    };
    // Qualquer clique ou tecla fora do botão. Roda na captura, antes dos cliques
    // da lista: o efeito do próprio gesto já encontra o áudio acordado.
    const onGesture = (event: Event) => {
      if (button.contains(event.target as Node)) return;
      if (armed && !active) turnOn();
      else if (active) {
        unlock();
        if (audio.paused && !document.hidden) void play();
      }
    };
    // Em aba escondida a música pausa; ao voltar, continua de onde parou. O
    // botão segue ligado: é uma pausa, não um desligar.
    let resume = false;
    const onVisibility = () => {
      if (document.hidden) {
        resume = !audio.paused;
        audio.pause();
      } else if (resume && active) void play();
    };
    const onPageHide = () => {
      mark(active);
      audio.pause();
    };

    button.addEventListener('click', onToggle);
    document.addEventListener('click', onGesture, true);
    document.addEventListener('keydown', onGesture, true);
    document.addEventListener('visibilitychange', onVisibility);
    addEventListener('pagehide', onPageHide);
    return () => {
      // Sair da home por navegação do Next.js mantém o documento: o som para aqui.
      disposed = true;
      // Só grava, nunca apaga: em desenvolvimento o React desmonta e remonta o
      // componente, e apagar aqui tiraria a marca que a segunda montagem lê.
      // Quem apaga a marca é o desligar (`onToggle`) e o `pagehide`.
      if (active) mark(true);
      audio.pause();
      audio.removeAttribute('src');
      setActive(false);
      closeSound();
      button.removeEventListener('click', onToggle);
      document.removeEventListener('click', onGesture, true);
      document.removeEventListener('keydown', onGesture, true);
      document.removeEventListener('visibilitychange', onVisibility);
      removeEventListener('pagehide', onPageHide);
    };
  }, [src]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="home-music"
        aria-pressed="false"
        aria-label={label}
        title={label}
      >
        <span className="home-music-disc" aria-hidden="true">
          <svg viewBox="0 0 16 16">
            <path d="M6 3.2 13 1.8v8.7a2 2 0 1 1-1.2-1.83V4.2L7.2 5.1v6.4A2 2 0 1 1 6 9.67z" />
            {/* Desligada, a nota aparece riscada: o estado não depende de cor. */}
            <path className="home-music-slash" d="M2.5 13.5 13.5 2.5" />
          </svg>
        </span>
      </button>
      {/* Sem `src`: nada é baixado até a música tocar. */}
      <audio ref={audioRef} preload="none" loop />
    </>
  );
}

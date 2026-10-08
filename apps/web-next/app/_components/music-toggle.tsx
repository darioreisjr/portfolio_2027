import { useEffect, useRef } from 'react';
import { MUSIC_STORAGE_KEY } from '../../lib/music';
import { ON, closeSound, setSound, sfx, unlock } from '../../lib/sfx';

/**
 * Botão de som da home (ADR 0008): liga a música de fundo e os efeitos de
 * seleção (`lib/sfx.ts`). Começa desligado. O arquivo da música só é pedido
 * quando ela vai tocar de fato, nunca na carga da página. A escolha fica no
 * navegador: quem ligou encontra o botão ligado na visita seguinte, e o som
 * começa no primeiro gesto, porque o navegador não deixa tocar antes.
 * O estado vive em `aria-pressed`; não há estado do React nem nova renderização.
 *
 * Só é renderizado no navegador, por `persona-list.tsx`: sem JavaScript o botão
 * não existe, e o lugar dele no grupo do canto fica guardado, vazio.
 */
export function MusicToggle({ label, src }: { label: string; src: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const audio = audioRef.current;
    if (!button || !audio) return;

    const wanted = () => button.getAttribute('aria-pressed') === 'true';
    const setWanted = (on: boolean) => {
      button.setAttribute('aria-pressed', String(on));
      setSound(on);
    };
    const remember = (on: boolean) => {
      try {
        if (on) localStorage.setItem(MUSIC_STORAGE_KEY, 'on');
        else localStorage.removeItem(MUSIC_STORAGE_KEY);
      } catch {
        // Sem armazenamento, a escolha vale só para esta visita.
      }
    };
    const turnOff = () => {
      setWanted(false);
      remember(false);
      audio.pause();
    };
    // Se o arquivo não puder ser tocado, a música fica de fora nesta visita, mas
    // o botão continua ligado: os efeitos não dependem dela. Os outros motivos
    // de recusa passam: falta de gesto só adia para o próximo, e uma pausa logo
    // depois do pedido (aba escondida) não é erro.
    let broken = false;
    const play = () => {
      if (broken) return;
      if (!audio.getAttribute('src')) audio.src = src;
      audio.play().catch((error: unknown) => {
        broken = (error as DOMException).name === 'NotSupportedError';
      });
    };

    // Quem pediu para economizar dados não baixa a faixa sem pedir de novo.
    const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
    try {
      if (!saveData && localStorage.getItem(MUSIC_STORAGE_KEY) === 'on') setWanted(true);
    } catch {
      // Sem armazenamento, começa desligada.
    }
    // Numa remontagem o botão já está no DOM com o estado dele.
    setSound(wanted());
    const onToggle = () => {
      if (wanted()) turnOff();
      else {
        setWanted(true);
        remember(true);
        // Uma nota ao ligar: confirma que o som está funcionando.
        unlock();
        sfx(ON);
        play();
      }
    };
    // Primeiro gesto de uma visita com o som lembrado, ou depois de uma pausa.
    // Roda na captura, antes dos cliques da lista: o efeito do próprio gesto já
    // encontra o contexto de áudio acordado.
    const onGesture = (event: Event) => {
      unlock();
      if (button.contains(event.target as Node)) return;
      if (wanted() && audio.paused) play();
    };
    // Em aba escondida a música pausa; ao voltar, continua de onde parou.
    let resume = false;
    const onVisibility = () => {
      if (document.hidden) {
        resume = !audio.paused;
        audio.pause();
      } else if (resume && wanted()) play();
    };
    const onPageHide = () => audio.pause();

    button.addEventListener('click', onToggle);
    document.addEventListener('click', onGesture, true);
    document.addEventListener('keydown', onGesture, true);
    document.addEventListener('visibilitychange', onVisibility);
    addEventListener('pagehide', onPageHide);
    return () => {
      // Sair da home por navegação do Next.js mantém o documento: a música para aqui.
      audio.pause();
      audio.removeAttribute('src');
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

/**
 * Resposta ao pop-up de imersão da home e, depois dela, o estado do botão de
 * pausa: `on` (animações rodando) ou `off` (pausadas). Ausente: a pessoa ainda
 * não respondeu, e o pop-up aparece. Só este app lê a chave (ADR 0008).
 */
export const INTRO_STORAGE_KEY = 'portfolio:home-animacoes';

/** O `<dialog>` do pop-up, renderizado no servidor por `home-stage.tsx`. */
export const INTRO_ID = 'home-intro';

/**
 * Liga o pop-up de imersão e a lembrança da pausa. Chamado por
 * `persona-list.tsx`, para sair no mesmo arquivo de script (ADR 0008).
 * `setSound` liga ou desliga o som da home; quem responde é o botão de som.
 */
export function setupIntro(setSound: (on: boolean) => void): () => void {
  const dialog = document.getElementById(INTRO_ID) as HTMLDialogElement | null;
  const pause = document.querySelector<HTMLInputElement>('.home-motion input');
  const immersion = dialog?.querySelector('input');
  const start = dialog?.querySelector('button');
  if (!dialog || !pause || !immersion || !start) return () => {};

  const save = (moving: boolean) => {
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, moving ? 'on' : 'off');
    } catch {
      // Sem armazenamento, a escolha vale só para esta página.
    }
  };
  let answer: string | null = 'on';
  try {
    answer = localStorage.getItem(INTRO_STORAGE_KEY);
  } catch {
    // Sem armazenamento não há como lembrar a resposta: o pop-up não aparece.
  }

  if (answer === 'off') pause.checked = true;
  // `open`: em desenvolvimento o React monta duas vezes, e o pop-up já está aberto.
  else if (answer === null && !dialog.open) dialog.showModal();

  const onPause = () => save(!pause.checked);
  const onStart = () => dialog.close();
  // Fechar pelo botão ou por Esc vale a caixa como estiver.
  const onClose = () => {
    pause.checked = !immersion.checked;
    save(immersion.checked);
    setSound(immersion.checked);
  };
  pause.addEventListener('change', onPause);
  start.addEventListener('click', onStart);
  dialog.addEventListener('close', onClose);
  return () => {
    pause.removeEventListener('change', onPause);
    start.removeEventListener('click', onStart);
    dialog.removeEventListener('close', onClose);
  };
}

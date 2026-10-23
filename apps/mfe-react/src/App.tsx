import type { ClientContent, ClientUi } from '@portfolio/content/client';
import type { Ui } from '@portfolio/content/schemas';
import { emitMfeReady, type Locale } from '@portfolio/contracts';
import { useEffect } from 'react';
import { ClientPage } from './client/ClientPage.tsx';

export interface AppProps {
  locale: Locale;
  /** Conteúdo da área; `null`: a tela "em construção". */
  content: ClientContent | null;
  text: ClientUi;
  construction: Ui['construction'];
}

export function App({ locale, content, text, construction }: AppProps) {
  useEffect(() => emitMfeReady({ area: 'client', locale }), [locale]);

  if (content && text) return <ClientPage content={content} text={text} />;

  // Sem conteúdo, a mensagem "em construção", sem estilo próprio: a aparência
  // vem de /_ds/areas.css, pelos `part` (ADR 0009).
  const message = construction;
  return (
    <section part="message">
      <h2 part="title">{message.title}</h2>
      <p part="text">{message.text}</p>
      <div part="bar" aria-hidden="true">
        <span part="bar-fill" />
      </div>
    </section>
  );
}

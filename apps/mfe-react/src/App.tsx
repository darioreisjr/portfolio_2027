import { client, clientUi, type ClientContent, type ClientUi } from '@portfolio/content/client';
import type { Ui } from '@portfolio/content/schemas';
import { ui } from '@portfolio/content/ui';
import { emitMfeReady, type Locale } from '@portfolio/contracts';
import { useEffect } from 'react';
import { ClientPage } from './client/ClientPage.tsx';

interface AppProps {
  locale: Locale;
  /** Conteúdo da área; por padrão, o do pacote. `null`: a tela "em construção". */
  content?: ClientContent | null;
  text?: ClientUi;
  construction?: Ui['construction'];
}

export function App({
  locale,
  content = client?.[locale] ?? null,
  text = clientUi[locale],
  construction = ui[locale].construction,
}: AppProps) {
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

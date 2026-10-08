import { ui } from '@portfolio/content/ui';
import { emitMfeReady, type Locale } from '@portfolio/contracts';
import { useEffect } from 'react';

/** Sem estilo próprio: a aparência vem de /_ds/areas.css, pelos `part` (ADR 0009). */
export function App({ locale }: { locale: Locale }) {
  useEffect(() => emitMfeReady({ area: 'client', locale }), [locale]);
  const text = ui[locale].construction;

  return (
    <section part="message">
      <h2 part="title">{text.title}</h2>
      <p part="text">{text.text}</p>
      <div part="bar" aria-hidden="true">
        <span part="bar-fill" />
      </div>
    </section>
  );
}

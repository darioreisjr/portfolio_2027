import { ui } from '@portfolio/content/ui';
import { emitMfeReady, type Locale } from '@portfolio/contracts';
import type {} from '@portfolio/design-system/react';
import { useEffect } from 'react';

const styles = `
  .hello {
    display: flex;
    align-items: center;
    gap: var(--space-inline-sm);
    margin: 0;
    color: var(--color-text);
    font-size: var(--text-size-md);
  }
`;

export function App({ locale }: { locale: Locale }) {
  useEffect(() => emitMfeReady({ area: 'client', locale }), [locale]);

  return (
    <section>
      <style>{styles}</style>
      <p className="hello">
        {ui[locale].hello}
        <ds-badge>React</ds-badge>
      </p>
    </section>
  );
}

// Tipos das tags do design system para JSX (React e Next.js).
// Uso: import type {} from '@portfolio/design-system/react';
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type CustomElementProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ds-badge': CustomElementProps;
      'ds-theme-toggle': CustomElementProps & { label: string };
    }
  }
}

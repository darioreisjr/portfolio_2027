// Fonte dos tokens. scripts/build.mjs gera dist/tokens.css a partir daqui.
// Três camadas (ADR 0003): apps e componentes usam só semânticos e de componente.

export const primitives = {
  'color-neutral-0': '#ffffff',
  'color-neutral-100': '#eef0f4',
  'color-neutral-300': '#c3c8d2',
  'color-neutral-600': '#4d5565',
  'color-neutral-900': '#161a22',
  'color-neutral-950': '#0c0e13',
  'color-blue-300': '#93c5fd',
  'color-blue-700': '#1d4ed8',
  'space-1': '0.25rem',
  'space-2': '0.5rem',
  'space-4': '1rem',
  'space-6': '1.5rem',
  'space-8': '2rem',
  'space-12': '3rem',
  'border-width-thick': '3px',
  'duration-200': '200ms',
  'ease-out': 'cubic-bezier(0.2, 0, 0, 1)',
  'radius-pill': '999px',
  'font-sans': "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  'font-size-100': '0.875rem',
  'font-size-200': '1rem',
  'font-size-300': '1.25rem',
  'font-size-500': '1.75rem',
  'font-weight-strong': '600',
  'line-height-body': '1.5',
};

/** Mudam de valor conforme o tema. As duas listas têm as mesmas chaves. */
export const semantic = {
  light: {
    'color-surface': 'var(--color-neutral-0)',
    'color-surface-muted': 'var(--color-neutral-100)',
    'color-text': 'var(--color-neutral-900)',
    'color-text-muted': 'var(--color-neutral-600)',
    'color-border': 'var(--color-neutral-300)',
    'color-accent': 'var(--color-blue-700)',
    'color-on-accent': 'var(--color-neutral-0)',
    'color-focus-ring': 'var(--color-blue-700)',
  },
  dark: {
    'color-surface': 'var(--color-neutral-950)',
    'color-surface-muted': 'var(--color-neutral-900)',
    'color-text': 'var(--color-neutral-100)',
    'color-text-muted': 'var(--color-neutral-300)',
    'color-border': 'var(--color-neutral-600)',
    'color-accent': 'var(--color-blue-300)',
    'color-on-accent': 'var(--color-neutral-950)',
    'color-focus-ring': 'var(--color-blue-300)',
  },
};

/** Não mudam com o tema, mas apps os usam no lugar dos primitivos. */
export const semanticStatic = {
  'space-inline-sm': 'var(--space-2)',
  'space-inline-md': 'var(--space-4)',
  'space-inline-lg': 'var(--space-8)',
  'space-block-xs': 'var(--space-1)',
  'space-block-sm': 'var(--space-2)',
  'space-block-md': 'var(--space-4)',
  'space-block-lg': 'var(--space-6)',
  'space-block-xl': 'var(--space-12)',
  'focus-ring-width': 'var(--border-width-thick)',
  'focus-ring-offset': 'var(--space-1)',
  'motion-duration-md': 'var(--duration-200)',
  'motion-ease-out': 'var(--ease-out)',
  'font-body': 'var(--font-sans)',
  'text-size-sm': 'var(--font-size-100)',
  'text-size-md': 'var(--font-size-200)',
  'text-size-lg': 'var(--font-size-300)',
  'text-size-title': 'var(--font-size-500)',
  'text-weight-strong': 'var(--font-weight-strong)',
  'text-line-height': 'var(--line-height-body)',
  'radius-full': 'var(--radius-pill)',
};

export const component = {
  'ds-badge-bg': 'var(--color-accent)',
  'ds-badge-text': 'var(--color-on-accent)',
  'ds-badge-padding-block': 'var(--space-block-xs)',
  'ds-badge-padding-inline': 'var(--space-inline-sm)',
  'ds-badge-radius': 'var(--radius-full)',
  'ds-badge-font-size': 'var(--text-size-sm)',
};

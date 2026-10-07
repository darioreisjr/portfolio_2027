import '../home.css';
import type { Locale } from '@portfolio/contracts';
import type {} from '@portfolio/design-system/react';
import Link from 'next/link';
import { buildHome, type Persona } from '../../lib/home';
import { PersonaList } from './persona-list';

// Proporção das silhuetas; a arte final precisa manter (ver AGENTS.md do app).
const FIGURE = { width: 120, height: 320 };

function PersonaLink({ persona, enter }: { persona: Persona; enter: string }) {
  const content = (
    <>
      {/* Decorativa: quem diz o que é o perfil é a frase. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sem otimizador */}
      <img className="persona-figure" src={persona.image} alt="" {...FIGURE} />
      <span className="persona-caption">
        <span className="persona-phrase">{persona.phrase}</span>
        <span className="persona-summary">{persona.summary}</span>
        <ds-badge>{persona.badge}</ds-badge>
        <span className="persona-enter" aria-hidden="true">
          {enter}
        </span>
      </span>
    </>
  );

  // Áreas do shell são outro documento: <a>, nunca <Link> (ADR 0002).
  return persona.sameApp ? (
    <Link className="persona" href={persona.href}>
      {content}
    </Link>
  ) : (
    <a className="persona" href={persona.href}>
      {content}
    </a>
  );
}

export function HomeStage({ locale }: { locale: Locale }) {
  const { identity, title, enter, personas, more } = buildHome(locale);

  return (
    <main className="home">
      {identity && (
        <p className="home-identity">
          <strong>{identity.name}</strong>
          <span>{identity.role}</span>
        </p>
      )}
      <h1 id="home-title">{title}</h1>
      <nav aria-labelledby="home-title">
        <PersonaList>
          {personas.map((persona) => (
            <li key={persona.area}>
              <PersonaLink persona={persona} enter={enter} />
            </li>
          ))}
        </PersonaList>
        {/* Só no carrossel: indica quantos personagens há e qual está à vista. */}
        <div className="persona-dots" aria-hidden="true">
          {personas.map((persona) => (
            <span key={persona.area} />
          ))}
        </div>
      </nav>
      <p className="home-more">
        <Link href={more.href}>{more.label}</Link>
      </p>
    </main>
  );
}

import '../home.css';
import type { Locale } from '@portfolio/contracts';
import type {} from '@portfolio/design-system/react';
import Link from 'next/link';
import { buildHome, type Persona } from '../../lib/home';
import { PersonaList } from './persona-list';
import { SakuraScene } from './sakura-scene';

function PersonaLink({ persona, enter }: { persona: Persona; enter: string }) {
  const content = (
    <>
      {/* Decorativa: quem diz o que é o perfil é a frase. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sem otimizador */}
      <img
        className="persona-figure"
        src={persona.figure.src}
        alt=""
        width={persona.figure.width}
        height={persona.figure.height}
      />
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
  const { identity, title, enter, pauseMotion, personas, more } = buildHome(locale);

  return (
    <main className="home">
      <SakuraScene />
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
        {more.sameApp ? (
          <Link href={more.href}>{more.label}</Link>
        ) : (
          <a href={more.href}>{more.label}</a>
        )}
      </p>
      {/* No fim do documento: o primeiro Tab continua caindo no primeiro personagem. */}
      <label className="home-motion">
        <input type="checkbox" />
        {pauseMotion}
      </label>
    </main>
  );
}

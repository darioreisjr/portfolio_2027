import '../home.css';
import type { Locale } from '@portfolio/contracts';
import Link from 'next/link';
import { buildHome, type Persona } from '../../lib/home';
import { PersonaList } from './persona-list';
import { SakuraScene } from './sakura-scene';

interface PersonaItemProps {
  persona: Persona;
  enter: string;
  back: string;
  /** O primeiro personagem é o que aparece no celular: carrega antes dos outros. */
  first: boolean;
}

function PersonaItem({ persona, enter, back, first }: PersonaItemProps) {
  const ids = {
    actions: `persona-actions-${persona.area}`,
    phrase: `persona-phrase-${persona.area}`,
    description: `persona-description-${persona.area}`,
  };

  const figure = (
    <>
      {/* Decorativa: quem diz o que é o perfil é a frase. */}
      <picture>
        {persona.figure.avif && <source type="image/avif" srcSet={persona.figure.avif} />}
        <img
          className="persona-figure"
          src={persona.figure.src}
          alt=""
          width={persona.figure.width}
          height={persona.figure.height}
          // No carrossel os outros três estão fora da tela; só baixam quando chegam perto.
          loading={first ? 'eager' : 'lazy'}
          fetchPriority={first ? 'high' : 'low'}
          decoding="async"
        />
      </picture>
      <span className="persona-phrase" id={ids.phrase}>
        {persona.phrase}
      </span>
    </>
  );

  // Áreas do shell são outro documento: <a>, nunca <Link> (ADR 0002).
  const Anchor = persona.sameApp ? Link : 'a';

  return (
    <li data-area={persona.area}>
      {/* Sem JavaScript é um link para a área. Com JavaScript, persona-list.tsx
          faz dele o botão que escolhe o personagem e abre o painel abaixo.
          Sempre <a>: o <Link> navegaria antes de a lista tratar o clique. */}
      <a className="persona" href={persona.href} aria-controls={ids.actions}>
        {figure}
      </a>
      <div className="persona-actions" id={ids.actions} hidden>
        <p className="persona-description" id={ids.description}>
          {persona.description}
        </p>
        <Anchor
          className="persona-enter"
          href={persona.href}
          aria-describedby={`${ids.phrase} ${ids.description}`}
        >
          {enter}
        </Anchor>
        <button type="button" className="persona-back">
          {back}
        </button>
      </div>
    </li>
  );
}

export function HomeStage({ locale }: { locale: Locale }) {
  const { identity, title, enter, back, personas } = buildHome(locale);

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
          {personas.map((persona, index) => (
            <PersonaItem
              key={persona.area}
              persona={persona}
              enter={enter}
              back={back}
              first={index === 0}
            />
          ))}
        </PersonaList>
        {/* Só no carrossel: indica quantos personagens há e qual está à vista. */}
        <div className="persona-dots" aria-hidden="true">
          {personas.map((persona) => (
            <span key={persona.area} />
          ))}
        </div>
      </nav>
    </main>
  );
}

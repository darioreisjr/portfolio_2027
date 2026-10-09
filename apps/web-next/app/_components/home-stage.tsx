import '../home.css';
import type { Locale } from '@portfolio/contracts';
import Link from 'next/link';
import { buildHome, type HomeModel, type Persona } from '../../lib/home';
import { INTRO_ID } from '../../lib/intro';
import { MUSIC_SRC } from '../../lib/music';
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

/**
 * Pop-up da primeira visita: idioma e imersão (música e animações). Nasce
 * fechado; quem o abre é `lib/intro.ts`, só para quem ainda não respondeu. Sem
 * JavaScript ele não aparece. As bandeiras são links comuns (ADR 0006): trocar
 * de idioma recarrega a página, e o pop-up volta já traduzido.
 */
function Intro({ intro }: { intro: HomeModel['intro'] }) {
  return (
    <dialog className="home-intro" id={INTRO_ID} aria-labelledby="home-intro-title">
      <h2 id="home-intro-title">{intro.title}</h2>
      <ul className="home-intro-languages" aria-label={intro.languagesLabel}>
        {intro.languages.map(({ locale, name, href, flag, current }) => (
          <li key={locale}>
            {current ? (
              <span className="home-intro-flag" aria-current="true">
                {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sem otimizador */}
                <img src={flag} alt={name} width="28" height="28" />
              </span>
            ) : (
              <a
                className="home-intro-flag"
                href={href}
                lang={locale}
                hrefLang={locale}
                aria-label={name}
                title={name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- export estático, sem otimizador */}
                <img src={flag} alt="" width="28" height="28" loading="lazy" decoding="async" />
              </a>
            )}
          </li>
        ))}
      </ul>
      <label className="home-intro-immersion">
        <input type="checkbox" aria-describedby="home-intro-hint" />
        <span>{intro.immersion}</span>
        {/* Duas dicas, uma à vista: com movimento reduzido só a música liga. */}
        <small id="home-intro-hint">
          <span className="home-intro-hint">{intro.hint}</span>
          <span className="home-intro-hint-reduced">{intro.hintReduced}</span>
        </small>
      </label>
      <button type="button" className="persona-enter home-intro-start" autoFocus>
        {intro.start}
      </button>
    </dialog>
  );
}

export function HomeStage({ locale }: { locale: Locale }) {
  const { identity, title, enter, back, music, intro, personas } = buildHome(locale);

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
        <PersonaList music={{ label: music, src: MUSIC_SRC }}>
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
      <Intro intro={intro} />
    </main>
  );
}

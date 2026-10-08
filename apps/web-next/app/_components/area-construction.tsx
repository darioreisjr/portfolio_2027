import { ui } from '@portfolio/content/ui';
import { pathFor, personaFigure, type AreaId, type Locale } from '@portfolio/contracts';

/**
 * Tela "em construção" das páginas internas deste app (ADR 0009). O palco e a
 * mensagem são os mesmos das áreas do shell; lá a mensagem é do MFE, aqui é
 * este Server Component, com as classes equivalentes.
 */
export function AreaConstruction({ area, locale }: { area: AreaId; locale: Locale }) {
  const text = ui[locale];
  const figure = personaFigure(area);

  return (
    <>
      {/* A folha das páginas internas entra por <link>, nunca por `import`: o
          Next.js junta o CSS da rota única e ela iria para a home. */}
      {/* eslint-disable-next-line @next/next/no-css-tags -- folha compartilhada, fora do bundle */}
      <link rel="stylesheet" href="/_ds/areas.css" precedence="default" />
      <main className="area-stage" data-area={area}>
        <div className="area-scene" aria-hidden="true">
          <span className="area-scene-back" />
          <span className="area-scene-mid" />
          <span className="area-scene-front" />
          <span className="area-particles">
            {Array.from({ length: 10 }, (_, index) => (
              <i key={index} />
            ))}
          </span>
        </div>
        <h1 className="area-title">{text.areas[area].title}</h1>
        {figure && (
          <picture>
            <source type="image/avif" srcSet={figure.avif} />
            <img
              className="area-figure"
              src={figure.src}
              alt=""
              width={figure.width}
              height={figure.height}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        )}
        <div className="area-outlet">
          <section className="area-message">
            <h2 className="area-message-title">{text.construction.title}</h2>
            <p className="area-message-text">{text.construction.text}</p>
            <div className="area-bar" aria-hidden="true">
              <span className="area-bar-fill" />
            </div>
          </section>
        </div>
        {/* <a>, nunca <Link>: a home tem outro CSS e precisa de carga completa. */}
        <a className="area-back" href={pathFor('home', locale)}>
          {text.construction.back}
        </a>
      </main>
    </>
  );
}

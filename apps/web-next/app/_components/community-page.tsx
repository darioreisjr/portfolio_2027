import type { CommunityModel } from '../../lib/community';

/** Marcador de seção: uma esfera numerada, decorativa. */
function Ball({ number }: { number: number }) {
  return (
    <span className="c-ball" aria-hidden="true">
      {number}
    </span>
  );
}

function Example({ text }: { text: CommunityModel['text'] }) {
  return (
    <p className="c-example">
      <strong>{text.example.title}</strong> {text.example.text}
    </p>
  );
}

/**
 * Página da área da comunidade (ADR 0013, docs/plans/comunidade-conteudo.md).
 * Server Component, sem JavaScript próprio: as animações são CSS, e o único
 * comportamento, a transição do botão de volta, é um script inline do layout.
 */
export function CommunityPage({ model }: { model: CommunityModel }) {
  const { content, text, figure } = model;
  const count = (template: string, value: number) => template.replace('{count}', String(value));

  return (
    <>
      {/* A folha desta página entra por <link>, nunca por `import`: o Next.js
          junta o CSS da rota única e ela iria para a home. */}
      {/* eslint-disable-next-line @next/next/no-css-tags -- folha só desta página, fora do bundle */}
      <link rel="stylesheet" href="/_home/community.css" precedence="default" />
      {/* Cortinas da transição "explosão de aura" (ADR 0011): a que abre para
          quem chega pela home e a que fecha ao voltar. */}
      <div className="community-arrival" aria-hidden="true" />
      <div className="community-departure" role="status" hidden>
        <span>{model.leaving}</span>
      </div>

      <main className="community">
        <header className="c-hero">
          {/* Linhas de velocidade e aura: enfeite. */}
          <span className="c-speed" aria-hidden="true" />
          <span className="c-aura" aria-hidden="true" />
          {figure && (
            <picture>
              <source type="image/avif" srcSet={figure.avif} />
              <img
                className="c-figure"
                src={figure.src}
                alt=""
                width={figure.width}
                height={figure.height}
                // Enfeite pequeno: não disputa a carga inicial com o texto,
                // que é o maior elemento da tela (budgets.md).
                loading="lazy"
                fetchPriority="low"
                decoding="async"
              />
            </picture>
          )}
          <h1>{model.title}</h1>
          <p className="c-title">{text.hero.title}</p>
          <p className="c-lead">{text.hero.text}</p>
        </header>

        <section aria-labelledby="c-articles">
          <h2 id="c-articles">
            <Ball number={1} />
            {text.articles.title}
          </h2>
          {content.example.articles && <Example text={text} />}
          <p className="c-total">{count(text.power.total, model.totalMinutes)}</p>
          <ul className="c-articles">
            {model.articles.map((article) => (
              <li key={article.id}>
                <h3>
                  <a href={article.url} rel="noopener">
                    {article.title}
                  </a>
                </h3>
                <p>{article.summary}</p>
                <p className="c-meta">
                  <time dateTime={article.publishedAt}>{article.date}</time>
                  {' · '}
                  {text.articles.written} {article.language}
                </p>
                {/* Medidor de "poder": o tempo de leitura, em desenho e em texto. */}
                <p className="c-power">
                  <span className="c-power-label">{text.power.label}</span>
                  <span className="c-power-track" aria-hidden="true">
                    <i style={{ inlineSize: `${article.power}%` }} />
                  </span>
                  <strong>{count(text.power.minutes, article.readingMinutes)}</strong>
                </p>
                {article.tags.length > 0 && (
                  <ul className="c-tags">
                    {article.tags.map((tag) => (
                      <li key={tag}>
                        <ds-badge>{tag}</ds-badge>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="c-projects">
          <h2 id="c-projects">
            <Ball number={2} />
            {text.projects.title}
          </h2>
          <ul className="c-capsules">
            {/* O repositório deste site é real: fica fora da faixa de exemplo. */}
            <li className="c-capsule">
              <div className="c-capsule-top">
                <h3>{text.projects.thisSite.title}</h3>
                <ds-badge>{text.projects.statuses.active}</ds-badge>
              </div>
              <div className="c-capsule-body">
                <p>{text.projects.thisSite.description}</p>
                <a href={model.repository} rel="noopener">
                  {text.projects.repo}
                </a>
              </div>
            </li>
          </ul>
          {content.projects.length > 0 && (
            <>
              {content.example.projects && <Example text={text} />}
              <ul className="c-capsules">
                {content.projects.map((project) => (
                  <li key={project.id} className="c-capsule">
                    <div className="c-capsule-top">
                      <h3>{project.title}</h3>
                      <ds-badge>{text.projects.statuses[project.status]}</ds-badge>
                    </div>
                    <div className="c-capsule-body">
                      <p>{project.summary}</p>
                      {project.skills.length > 0 && (
                        <p className="c-meta">{project.skills.join(' · ')}</p>
                      )}
                      {project.repo && (
                        <a href={project.repo} rel="noopener">
                          {text.projects.repo}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* Vitrine: as peças de verdade do site. As amostras leem os tokens do
            tema em uso; trocar o tema no botão do canto muda todas. */}
        <section aria-labelledby="c-showcase">
          <h2 id="c-showcase">
            <Ball number={3} />
            {text.showcase.title}
          </h2>
          <p>{text.showcase.text}</p>
          <h3>{text.showcase.components}</h3>
          <dl className="c-parts">
            <div>
              <dt>
                {text.showcase.badge} <code>ds-badge</code>
              </dt>
              <dd>
                <ds-badge>{text.showcase.badgeSample}</ds-badge>
              </dd>
            </div>
            <div>
              <dt>
                {text.showcase.themeToggle} <code>ds-theme-toggle</code>
              </dt>
              <dd>{text.showcase.themeHint}</dd>
            </div>
          </dl>
          <h3>{text.showcase.colors}</h3>
          <p className="c-meta">{text.showcase.areaColors}</p>
          <ul className="c-swatches">
            {model.areaColors.map((name) => (
              <li key={name}>
                <span style={{ background: `var(--${name})` }} aria-hidden="true" />
                <code>--{name}</code>
              </li>
            ))}
          </ul>
          <p className="c-meta">{text.showcase.baseColors}</p>
          <ul className="c-swatches">
            {model.baseColors.map((name) => (
              <li key={name}>
                <span style={{ background: `var(--${name})` }} aria-hidden="true" />
                <code>--{name}</code>
              </li>
            ))}
          </ul>
          <h3>{text.showcase.type}</h3>
          <ul className="c-type">
            {model.typeSizes.map((name) => (
              <li key={name}>
                <span style={{ fontSize: `var(--${name})` }}>{text.showcase.typeSample}</span>
                <code>--{name}</code>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="c-join">
          <h2 id="c-join">
            <Ball number={4} />
            {text.join.title}
          </h2>
          {content.channels.length > 0 && (
            <>
              <h3>{text.join.follow}</h3>
              {content.example.channels && <Example text={text} />}
              <ul className="c-channels">
                {content.channels.map((channel) => (
                  <li key={channel.id}>
                    <a href={channel.url} rel="noopener">
                      {text.join.channels[channel.kind]}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3>{text.join.welcome}</h3>
          <ul className="c-welcome">
            {text.join.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            <a href={model.builtHref}>{text.join.built}</a>
          </p>
        </section>

        {/* <a>, nunca <Link>: a home tem outro CSS e precisa de carga completa. */}
        <a className="c-back" href={model.homeHref}>
          {model.back}
        </a>
      </main>
    </>
  );
}

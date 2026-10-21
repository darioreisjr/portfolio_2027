import { HOME_ASSETS_PATH } from '@portfolio/contracts';
import type { HowItWasBuiltModel } from '../../lib/how-it-was-built';

/**
 * Página "Como foi feito" (ADR 0013, docs/plans/como-foi-feito-conteudo.md).
 * Server Component, sem JavaScript no bundle do cliente: animações exclusivamente em CSS
 * e transição de saída via script inline.
 */
export function HowItWasBuiltPage({ model }: { model: HowItWasBuiltModel }) {
  const { content } = model;
  const { hero, architecture, adrs, designSystem, metrics, footer, repository } = content;

  return (
    <>
      {/* Folha isolada servida de public/, sem contaminar a home (ADR 0013). */}
      <link
        rel="stylesheet"
        href={`${HOME_ASSETS_PATH}how-it-was-built.css`}
        precedence="default"
      />

      {/* Cortinas da transição "desdobramento de blueprint" (ADR 0011). */}
      <div className="built-arrival" aria-hidden="true" />
      <div className="built-departure" aria-hidden="true" hidden>
        <span>{model.leaving}</span>
      </div>
      <div className="built-departure-status" role="status" aria-live="polite" aria-atomic="true" />

      <main className="how-it-was-built">
        {/* Reticulado técnico de fundo e linhas de cota decorativas */}
        <div className="b-grid-pattern" aria-hidden="true" />
        <div className="b-dimension-line-top" aria-hidden="true">
          <span>|← 1280px CANVAS // BLUEPRINT SPEC →|</span>
        </div>

        {/* HERO / CARIMBO DE ENGENHARIA */}
        <header className="b-hero">
          <div className="b-hero-stamp" aria-hidden="true">
            <span className="b-stamp-item">{hero.stamps.spec}</span>
            <span className="b-stamp-item">{hero.stamps.rev}</span>
            <span className="b-stamp-item">{hero.stamps.measured}</span>
            <span className="b-stamp-item b-stamp-highlight">{hero.stamps.repo}</span>
          </div>

          <span className="b-badge">{hero.badge}</span>
          <h1 className="b-title">{hero.title}</h1>
          <p className="b-subtitle">{hero.subtitle}</p>
          <p className="b-lead">{hero.lead}</p>
        </header>

        {/* BLOCO 1: A ARQUITETURA */}
        <section className="b-section" aria-labelledby="b-arch-title">
          <header className="b-section-header">
            <span className="b-tag">{architecture.tag}</span>
            <h2 id="b-arch-title">{architecture.title}</h2>
            <p className="b-section-lead">{architecture.lead}</p>
          </header>

          <h3 className="b-subheading">{architecture.appsTitle}</h3>
          <div className="b-apps-grid">
            {architecture.apps.map((app) => (
              <article key={app.id} className="b-app-card">
                <div className="b-card-spec" aria-hidden="true">
                  <span>ID: {app.id}</span>
                  <span>{app.framework}</span>
                </div>
                <h4>{app.name}</h4>
                <p className="b-app-role">{app.role}</p>
                <p className="b-app-desc">{app.description}</p>
              </article>
            ))}
          </div>

          <div className="b-arch-details">
            <div className="b-boundaries">
              <h3 className="b-subheading">{architecture.boundariesTitle}</h3>
              <ul className="b-boundaries-list">
                {architecture.boundaries.map((rule, idx) => (
                  <li key={idx}>
                    <span className="b-rule-index" aria-hidden="true">
                      [RULE-{String(idx + 1).padStart(2, '0')}]
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="b-pipeline-box">
              <h3 className="b-subheading">{architecture.pipelineTitle}</h3>
              <p>{architecture.pipelineDescription}</p>
              <div className="b-flow-diagram" aria-hidden="true">
                <span className="b-flow-step">pnpm build</span>
                <span className="b-flow-arrow">→</span>
                <span className="b-flow-step">pnpm assemble</span>
                <span className="b-flow-arrow">→</span>
                <span className="b-flow-step">dist/ (100% estático)</span>
              </div>
            </div>
          </div>
        </section>

        {/* BLOCO 2: AS 15 DECISÕES DE ARQUITETURA (ADRs) */}
        <section className="b-section" aria-labelledby="b-adrs-title">
          <header className="b-section-header">
            <span className="b-tag">{adrs.tag}</span>
            <h2 id="b-adrs-title">{adrs.title}</h2>
            <p className="b-section-lead">{adrs.lead}</p>
          </header>

          <div className="b-adrs-grid">
            {adrs.items.map((adr) => (
              <article key={adr.number} className={`b-adr-card b-status-${adr.status}`}>
                <div className="b-adr-meta">
                  <span className="b-adr-num">ADR {String(adr.number).padStart(4, '0')}</span>
                  <span className={`b-adr-status b-badge-${adr.status}`}>{adr.statusLabel}</span>
                  <span className="b-adr-cat">{adrs.categories[adr.category] ?? adr.category}</span>
                </div>
                <h3 className="b-adr-title" lang="pt-BR">
                  {adr.title}
                </h3>
                <p className="b-adr-summary">{adr.summary}</p>
              </article>
            ))}
          </div>
        </section>

        {/* BLOCO 3: DESIGN SYSTEM & TOKENS */}
        <section className="b-section" aria-labelledby="b-ds-title">
          <header className="b-section-header">
            <span className="b-tag">{designSystem.tag}</span>
            <h2 id="b-ds-title">{designSystem.title}</h2>
            <p className="b-section-lead">{designSystem.lead}</p>
          </header>

          <div className="b-points-grid">
            {designSystem.points.map((point, idx) => (
              <div key={idx} className="b-point-card">
                <div className="b-point-header">
                  <span className="b-point-index" aria-hidden="true">
                    0{idx + 1}
                  </span>
                  <h3>{point.title}</h3>
                </div>
                <p>{point.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BLOCO 4: MÉTRICAS E ORÇAMENTOS REAIS */}
        <section className="b-section" aria-labelledby="b-metrics-title">
          <header className="b-section-header">
            <span className="b-tag">{metrics.tag}</span>
            <h2 id="b-metrics-title">{metrics.title}</h2>
            <p className="b-section-lead">{metrics.lead}</p>
          </header>

          <div className="b-table-container">
            <table className="b-table">
              <thead>
                <tr>
                  <th scope="col">{metrics.tableHeaders.area}</th>
                  <th scope="col">{metrics.tableHeaders.framework}</th>
                  <th scope="col">{metrics.tableHeaders.jsBudget}</th>
                  <th scope="col">{metrics.tableHeaders.lcp}</th>
                  <th scope="col">{metrics.tableHeaders.a11y}</th>
                </tr>
              </thead>
              <tbody>
                {metrics.areas.map((a) => {
                  const pct = Math.round((a.jsKb / a.maxKb) * 100);
                  const lcpSec = a.lcpMs ? (a.lcpMs / 1000).toFixed(2) + ' s' : '—';
                  const a11yScore = a.accessibility ?? 100;
                  return (
                    <tr key={a.area}>
                      <th scope="row" className="b-table-area">
                        <code>{a.path}</code>
                      </th>
                      <td>{a.framework}</td>
                      <td>
                        <div className="b-budget-cell">
                          <span>
                            {a.jsKb} kB / {a.maxKb} kB ({pct}%)
                          </span>
                          <div className="b-budget-bar" aria-hidden="true">
                            <i style={{ inlineSize: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td>{lcpSec}</td>
                      <td>
                        <span className="b-score-100">{a11yScore} / 100</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="b-metrics-footer">
            <div className="b-waterfall-card">
              <h3>{metrics.zeroWaterfallTitle}</h3>
              <p>{metrics.zeroWaterfallText}</p>
            </div>
            <p className="b-timestamp">{metrics.measuredAtFormatted}</p>
          </div>
        </section>

        {/* CONCLUSÃO E RETORNO */}
        <footer className="b-footer" aria-labelledby="b-footer-title">
          <span className="b-tag">{footer.tag}</span>
          <h2 id="b-footer-title">{footer.title}</h2>
          <p className="b-footer-text">{footer.text}</p>
          <div className="b-actions">
            <a
              className="b-btn b-btn-repo"
              href={repository}
              target="_blank"
              rel="noopener noreferrer"
            >
              {footer.repoButton}
            </a>
            <a className="b-btn b-back" href={model.homeHref}>
              {model.back}
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}

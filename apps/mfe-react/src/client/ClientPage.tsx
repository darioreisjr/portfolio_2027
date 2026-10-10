import type { ClientContent, ClientUi } from '@portfolio/content/client';
import { useEffect, useRef, type ReactNode } from 'react';
import styles from './client-page.css?inline';
import { animatePage } from './motion.ts';

interface WindowProps {
  /** Usado nos ids do título, para a seção ter nome. */
  name: string;
  /** Cabeçalho de notificação da janela. */
  tag: string;
  title: string;
  /** O bloco é rascunho: mostra a faixa "Dados de exemplo". */
  example?: boolean;
  text: ClientUi;
  /** A abertura não espera a rolagem para aparecer. */
  first?: boolean;
  children: ReactNode;
}

/** Janela do "Sistema": painel com borda luminosa e cabeçalho de notificação. */
function SystemWindow({ name, tag, title, example, text, first, children }: WindowProps) {
  return (
    <section
      className={`window ${name}`}
      aria-labelledby={`${name}-title`}
      data-reveal={first ? undefined : ''}
    >
      <p className="notice">{tag}</p>
      <h2 id={`${name}-title`}>{title}</h2>
      {example && (
        <p className="example">
          <strong>{text.example.title}</strong> {text.example.text}
        </p>
      )}
      {children}
    </section>
  );
}

/** Os canais de orçamento, como links diretos (âncora não atravessa o shadow DOM). */
function QuoteLinks({ content, text }: { content: ClientContent; text: ClientUi }) {
  return (
    <p className="quotes" role="group" aria-label={text.quote.label}>
      {content.contacts.map((contact) => (
        <a key={contact.id} className="quote" href={contact.url}>
          {text.quote[contact.kind]}
        </a>
      ))}
    </p>
  );
}

/**
 * Página da área do cliente (docs/plans/clientes-conteudo.md): para quem procura
 * alguém para fazer um projeto. Sem estado do React: as animações são ligadas
 * por um efeito e escritas direto no DOM, e as perguntas usam `<details>`.
 */
export function ClientPage({ content, text }: { content: ClientContent; text: ClientUi }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => (root.current ? animatePage(root.current) : undefined), [content]);

  return (
    <div className="page" ref={root}>
      {/* Estilo próprio, no shadow root (ADR 0010). */}
      <style>{styles}</style>

      <SystemWindow name="hero" tag={text.tags.hero} title={text.hero.title} text={text} first>
        {/* Portal: enfeite que gira ao fundo da abertura. */}
        <span className="portal" aria-hidden="true" />
        <p className="lead">{text.hero.text}</p>
        <QuoteLinks content={content} text={text} />
      </SystemWindow>

      <SystemWindow
        name="services"
        tag={text.tags.services}
        title={text.services.title}
        example={content.example.services}
        text={text}
      >
        <ul className="cards" data-cascade="">
          {content.services.map((service) => (
            <li key={service.id} className="card" data-tilt="">
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              {service.deliverables.length > 0 && (
                <>
                  <p className="label">{text.services.included}</p>
                  <ul className="checks">
                    {service.deliverables.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
        <QuoteLinks content={content} text={text} />
      </SystemWindow>

      <SystemWindow
        name="process"
        tag={text.tags.process}
        title={text.process.title}
        example={content.example.terms}
        text={text}
      >
        <ol className="steps" data-cascade="">
          {content.process.map((step, index) => (
            <li key={step.id}>
              <p className="level">
                {text.process.step} <b data-count="">{index + 1}</b>
              </p>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </SystemWindow>

      {content.cases.length > 0 && (
        <SystemWindow
          name="cases"
          tag={text.tags.cases}
          title={text.cases.title}
          example={content.example.cases}
          text={text}
        >
          {content.cases.map((project) => (
            <article key={project.id} className="case">
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <dl>
                <div data-from="left">
                  <dt>{text.cases.context}</dt>
                  <dd>{project.context}</dd>
                </div>
                <div data-from="right" className="after">
                  <dt>{text.cases.result}</dt>
                  <dd>{project.result}</dd>
                </div>
              </dl>
            </article>
          ))}
        </SystemWindow>
      )}

      {content.testimonials.length > 0 && (
        <SystemWindow
          name="testimonials"
          tag={text.tags.testimonials}
          title={text.testimonials.title}
          example={content.example.testimonials}
          text={text}
        >
          <div className="voices" data-cascade="">
            {content.testimonials.map((testimonial) => (
              <figure key={testimonial.id}>
                <blockquote>{testimonial.quote}</blockquote>
                <figcaption>
                  <strong>{testimonial.author}</strong>
                  {' · '}
                  {testimonial.role}
                  {testimonial.company && ` · ${testimonial.company}`}
                </figcaption>
              </figure>
            ))}
          </div>
        </SystemWindow>
      )}

      <SystemWindow
        name="engagement"
        tag={text.tags.engagement}
        title={text.engagement.title}
        example={content.example.terms}
        text={text}
      >
        <p className="lead">{content.engagement.pricing}</p>
        <ul className="cards models" data-cascade="">
          {content.engagement.models.map((model) => (
            <li key={model.id} className="card">
              <h3>{model.title}</h3>
              <p>{model.description}</p>
              <p className="timeline">
                <span className="label">{text.engagement.timeline}</span> {model.timeline}
              </p>
            </li>
          ))}
        </ul>
      </SystemWindow>

      {content.faq.length > 0 && (
        <SystemWindow
          name="faq"
          tag={text.tags.faq}
          title={text.faq.title}
          example={content.example.terms}
          text={text}
        >
          <div className="questions" data-cascade="">
            {content.faq.map((item) => (
              <details key={item.id}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </SystemWindow>
      )}

      <SystemWindow name="cta" tag={text.tags.cta} title={text.cta.title} text={text}>
        <p className="lead">{text.cta.text}</p>
        <QuoteLinks content={content} text={text} />
      </SystemWindow>
    </div>
  );
}

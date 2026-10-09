import { onMfeReady, type MfeReadyDetail } from '@portfolio/contracts';
import { TestBed } from '@angular/core/testing';
import { TechAreaComponent } from './tech-area.component';

// Os testes usam o conteúdo do pacote: os estudos de caso e as tecnologias de
// exemplo, e o raio-x real do site. O jsdom não tem `IntersectionObserver`:
// a entrada animada simplesmente não acontece, e tudo fica visível.
const root = (element: Element): ShadowRoot => {
  if (!element.shadowRoot) throw new Error('sem shadow root');
  return element.shadowRoot;
};
const texts = (scope: ParentNode, selector: string) =>
  [...scope.querySelectorAll(selector)].map((node) => node.textContent?.trim());
const press = (scope: ParentNode, label: string) => {
  const button = [...scope.querySelectorAll('button')].find(
    (candidate) => candidate.textContent?.trim() === label,
  );
  if (!button) throw new Error(`sem botão ${label}`);
  button.click();
  return button;
};

async function mount(locale: string) {
  const fixture = TestBed.createComponent(TechAreaComponent);
  fixture.componentRef.setInput('locale', locale);
  await fixture.whenStable();
  return { fixture, shadow: root(fixture.nativeElement as Element) };
}

describe('TechAreaComponent', () => {
  it('mostra a página no idioma e reage à troca, sem zone.js', async () => {
    const { fixture, shadow } = await mount('en');
    expect(shadow.querySelector('[part="message"]')).toBeNull();
    expect(shadow.textContent).toContain('Case studies');

    fixture.componentRef.setInput('locale', 'es');
    await fixture.whenStable();
    expect(shadow.textContent).toContain('Casos de estudio');
  });

  it('usa pt-BR quando o idioma é desconhecido', async () => {
    const { shadow } = await mount('xx');
    expect(shadow.textContent).toContain('Estudos de caso');
  });

  it('o estilo da raiz vive no shadow root e alcança a página filha', async () => {
    const { shadow } = await mount('pt-BR');
    expect(shadow.querySelector('style')?.textContent).toContain('.panel');
    expect(shadow.querySelector('app-tech-page .panel')).not.toBeNull();
  });

  it('a faixa de exemplo fica só no bloco dos dados fictícios; o raio-x é real', async () => {
    const { shadow } = await mount('pt-BR');
    const banners = shadow.querySelectorAll('.example');
    expect(banners).toHaveLength(1);
    expect(banners[0]?.closest('section')?.getAttribute('aria-labelledby')).toBe('projects-title');
    // Uma linha por área, com a tecnologia de cada uma.
    expect(texts(shadow, 'tbody tr td:first-of-type')).toEqual([
      'Next.js',
      'Vue',
      'Angular',
      'React',
      'Next.js',
      'Next.js',
    ]);
    expect(shadow.querySelector('.decisions li')?.textContent).toContain('ADR 0001');
  });

  it('cada estudo de caso tem problema, arquitetura e trade-offs', async () => {
    const { shadow } = await mount('pt-BR');
    const first = shadow.querySelector('.case');
    expect(texts(first as Element, 'dt')).toEqual(['Problema', 'Arquitetura', 'Trade-offs']);
    expect(first?.querySelectorAll('dd li').length).toBeGreaterThan(0);
  });

  it('o filtro da stack usa signals: uma categoria por vez', async () => {
    const { fixture, shadow } = await mount('pt-BR');
    const all = shadow.querySelectorAll('.skill').length;
    const backend = press(shadow, 'Back-end');
    await fixture.whenStable();
    expect(backend.getAttribute('aria-pressed')).toBe('true');
    expect(texts(shadow, '.skill-name')).toEqual(['Node.js', 'API REST']);
    press(shadow, 'Todas');
    await fixture.whenStable();
    expect(shadow.querySelectorAll('.skill')).toHaveLength(all);
  });

  it('o terminal responde a botão e a texto digitado, e limpa a saída', async () => {
    const { fixture, shadow } = await mount('pt-BR');
    const log = shadow.querySelector('[role="log"]') as Element;
    expect(log.textContent).toContain('Digite um comando');

    press(shadow, 'stack');
    await fixture.whenStable();
    expect(log.textContent).toContain('tecnologias, filtráveis por categoria');
    expect(log.querySelector('button')?.textContent?.trim()).toBe('Ir para a seção');

    const input = shadow.querySelector('input') as HTMLInputElement;
    input.value = 'nada';
    input.dispatchEvent(new Event('input'));
    shadow.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();
    expect(log.textContent).toContain('Comando não encontrado: nada. Digite ajuda.');
    expect(input.value).toBe('');

    press(shadow, 'limpar');
    await fixture.whenStable();
    expect(log.textContent).not.toContain('nada');
    expect(log.textContent).toContain('Digite um comando');
  });

  it('"ir para a seção" põe o foco no título, que âncora não alcançaria no shadow DOM', async () => {
    const { fixture, shadow } = await mount('pt-BR');
    document.body.append(fixture.nativeElement as Element);
    // O jsdom não implementa a rolagem.
    Element.prototype.scrollIntoView = () => {};
    press(shadow, 'adr');
    await fixture.whenStable();
    press(shadow.querySelector('[role="log"]') as Element, 'Ir para a seção');
    expect(shadow.activeElement?.id).toBe('decisions-title');
    (fixture.nativeElement as Element).remove();
  });
});

// Risco registrado no plano: createApplication + createCustomElement sem zone.js.
describe('mfe-tecnico como custom element', () => {
  afterEach(() => document.body.replaceChildren());

  it('monta pelo atributo, avisa o shell e reage à troca de atributo', async () => {
    await import('../main');

    const element = document.createElement('mfe-tecnico');
    element.setAttribute('locale', 'en');
    const ready = new Promise<MfeReadyDetail>((resolve) => {
      const cancel = onMfeReady((detail) => {
        cancel();
        resolve(detail);
      });
    });
    document.body.append(element);

    expect(await ready).toEqual({ area: 'tech', locale: 'en' });
    expect(root(element).textContent).toContain('Case studies');

    element.setAttribute('locale', 'es');
    await vi.waitFor(() => expect(root(element).textContent).toContain('Casos de estudio'));
  });
});

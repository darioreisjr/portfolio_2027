import { onMfeReady, type MfeReadyDetail } from '@portfolio/contracts';
import { TestBed } from '@angular/core/testing';
import { TechAreaComponent } from './tech-area.component';

const shadowText = (element: Element): string => element.shadowRoot?.textContent ?? '';

describe('TechAreaComponent', () => {
  it('mostra o olá do idioma e reage à troca, sem zone.js', async () => {
    const fixture = TestBed.createComponent(TechAreaComponent);

    fixture.componentRef.setInput('locale', 'en');
    await fixture.whenStable();
    expect(shadowText(fixture.nativeElement)).toContain('Hello');

    fixture.componentRef.setInput('locale', 'es');
    await fixture.whenStable();
    expect(shadowText(fixture.nativeElement)).toContain('Hola');
  });

  it('usa pt-BR quando o idioma é desconhecido', async () => {
    const fixture = TestBed.createComponent(TechAreaComponent);
    fixture.componentRef.setInput('locale', 'xx');
    await fixture.whenStable();
    expect(shadowText(fixture.nativeElement)).toContain('Olá');
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
    expect(shadowText(element)).toContain('Hello');
    expect(element.shadowRoot?.querySelector('ds-badge')).not.toBeNull();

    element.setAttribute('locale', 'es');
    await vi.waitFor(() => expect(shadowText(element)).toContain('Hola'));
  });
});

import type { Site, TechContent, TechUi } from '@portfolio/content/tech';
import { ui } from '@portfolio/content/ui';
import type { AreaId, Locale } from '@portfolio/contracts';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { flash, moving, reveal } from './reveal';

type Category = TechContent['skills'][number]['category'];
type CommandId = keyof TechUi['terminal']['commands'];
/** Seções para onde um comando do terminal leva. */
type Target = 'projects' | 'stack' | 'xray' | 'decisions';

interface Line {
  kind: 'command' | 'reply';
  text: string;
  /** Seção que a resposta oferece abrir. */
  target?: Target;
}

const COMMANDS: CommandId[] = ['projects', 'stack', 'xray', 'adr', 'help', 'clear'];
const LEVELS = ['learning', 'working', 'advanced'] as const;
/** Linhas guardadas na saída do terminal. */
const LOG_LIMIT = 40;

/**
 * Página da área técnica (docs/plans/tecnico-conteudo.md). Sem estilo próprio e
 * sem encapsulamento: o CSS é o da raiz (`tech-area.component.ts`), que vive no
 * shadow root e alcança este componente.
 */
@Component({
  selector: 'app-tech-page',
  templateUrl: './tech-page.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechPageComponent {
  readonly content = input.required<TechContent>();
  readonly text = input.required<TechUi>();
  readonly site = input.required<Site>();
  readonly locale = input.required<Locale>();

  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  protected readonly levels = LEVELS;
  protected readonly category = signal<Category | 'all'>('all');
  protected readonly categories = computed(() => [
    ...new Set(this.content().skills.map((skill) => skill.category)),
  ]);
  protected readonly skills = computed(() =>
    this.content().skills.filter(
      (skill) => this.category() === 'all' || skill.category === this.category(),
    ),
  );

  /** Os comandos com o nome que se digita neste idioma. */
  protected readonly commands = computed(() =>
    COMMANDS.map((id) => ({ id, ...this.text().terminal.commands[id] })),
  );
  protected readonly log = signal<Line[]>([]);
  protected readonly draft = signal('');
  private readonly typed: string[] = [];
  private cursor = 0;

  private readonly number = computed(
    () => new Intl.NumberFormat(this.locale(), { maximumFractionDigits: 1 }),
  );
  protected readonly measuredAt = computed(() =>
    new Intl.DateTimeFormat(this.locale(), { dateStyle: 'long', timeZone: 'UTC' }).format(
      new Date(`${this.site().measuredAt}T00:00:00Z`),
    ),
  );

  constructor() {
    const destroyed = inject(DestroyRef);
    afterNextRender(() => destroyed.onDestroy(reveal(this.host)));
  }

  protected areaName(area: string): string {
    return ui[this.locale()].areas[area as AreaId]?.title ?? area;
  }

  protected kb(value: number): string {
    return `${this.number().format(value)} kB`;
  }

  protected seconds(ms: number | undefined): string {
    return ms === undefined ? '–' : `${this.number().format(ms / 1000)} s`;
  }

  protected percent(used: number, max: number): number {
    return Math.round((used / max) * 100);
  }

  protected usage(used: number, max: number): string {
    return this.text().xray.usage.replace('{percent}', String(this.percent(used, max)));
  }

  protected adr(number: number): string {
    return `ADR ${String(number).padStart(4, '0')}`;
  }

  protected pickCategory(next: Category | 'all'): void {
    this.category.set(next);
    queueMicrotask(() => flash(this.host, [...this.host.querySelectorAll('.skill')]));
  }

  /** Executa o que foi digitado: o nome do comando neste idioma. */
  protected submit(event: Event, field: HTMLInputElement): void {
    event.preventDefault();
    const typed = field.value.trim();
    // Limpo direto no campo: se digitar e enviar caem no mesmo ciclo, o valor
    // ligado ao modelo não muda e o Angular não reescreveria o campo.
    field.value = '';
    this.draft.set('');
    if (!typed) return;
    this.typed.push(typed);
    this.cursor = this.typed.length;
    const command = this.commands().find(({ name }) => name === typed.toLowerCase());
    if (command) this.run(command.id);
    else {
      this.print([
        { kind: 'command', text: typed },
        { kind: 'reply', text: this.text().terminal.unknown.replace('{command}', typed) },
      ]);
    }
  }

  /** O mesmo que digitar o comando: é o que os botões chamam. */
  protected run(id: CommandId): void {
    const terminal = this.text().terminal;
    if (id === 'clear') {
      this.log.set([]);
      return;
    }
    const reply = (
      key: keyof TechUi['terminal']['replies'],
      count: number,
      target: Target,
    ): Line => ({
      kind: 'reply',
      text: terminal.replies[key].replace('{count}', String(count)),
      target,
    });
    const replies: Record<Exclude<CommandId, 'clear'>, Line[]> = {
      projects: [reply('projects', this.content().projects.length, 'projects')],
      stack: [reply('stack', this.content().skills.length, 'stack')],
      xray: [reply('xray', this.site().areas.length, 'xray')],
      adr: [reply('adr', this.site().decisions.length, 'decisions')],
      help: this.commands().map(({ name, description }) => ({
        kind: 'reply',
        text: `${name}  ${description}`,
      })),
    };
    this.print([{ kind: 'command', text: terminal.commands[id].name }, ...replies[id]]);
  }

  private print(lines: Line[]): void {
    this.log.update((log) => [...log, ...lines].slice(-LOG_LIMIT));
    queueMicrotask(() => {
      const output = this.host.querySelector('.log');
      if (!output) return;
      output.scrollTop = output.scrollHeight;
      flash(this.host, [...output.children].slice(-lines.length));
    });
  }

  /** Setas para cima e para baixo percorrem o que já foi digitado. */
  protected recall(event: KeyboardEvent): void {
    const step = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (!step || !this.typed.length) return;
    event.preventDefault();
    this.cursor = Math.min(this.typed.length, Math.max(0, this.cursor + step));
    this.draft.set(this.typed[this.cursor] ?? '');
  }

  /** Leva à seção e põe o foco no título dela (âncora não alcança o shadow DOM). */
  protected goTo(target: Target): void {
    const title = this.host.querySelector<HTMLElement>(`#${target}-title`);
    if (!title) return;
    title.scrollIntoView({ behavior: moving(this.host) ? 'smooth' : 'auto', block: 'start' });
    title.focus({ preventScroll: true });
  }
}

import type { Locale } from '@portfolio/contracts';
import type { Localized, Project, Skill } from './schemas.js';

/**
 * Tudo que a área técnica mostra de projetos e tecnologias em um idioma, já
 * filtrado e traduzido. O raio-x do site vem à parte (`site`): é dado real do
 * repositório e não depende de idioma.
 */
export interface TechContent {
  /** Os projetos e as tecnologias são rascunho: a página avisa que são de exemplo. */
  example: boolean;
  /** Estudos de caso: só os projetos com a narrativa técnica. */
  projects: {
    id: string;
    title: string;
    summary: string;
    problem: string;
    architecture: string;
    tradeoffs: string[];
    skills: string[];
    repo?: string;
    demo?: string;
  }[];
  skills: { id: string; name: string; category: Skill['category']; level: Skill['level'] }[];
}

/** Remove chaves sem valor, para o JSON gerado não levar `undefined`. */
const compact = <Value extends object>(value: Value): Value =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as Value;

export function buildTech(
  sources: { projects: Project[]; skills: Skill[]; example: boolean },
  locale: Locale,
): TechContent {
  const { projects, skills, example } = sources;
  // Rascunho pode ter só pt-BR; publicado tem os três, e a validação garante.
  const t = (value: Localized): string => value[locale] || value['pt-BR'];
  const skillName = new Map(skills.map((skill) => [skill.id, skill.name]));

  return {
    example,
    // Mais recente primeiro.
    projects: [...projects]
      .sort((a, b) => b.start.localeCompare(a.start))
      .flatMap((project) =>
        project.technical
          ? compact({
              id: project.id,
              title: t(project.title),
              summary: t(project.summary),
              problem: t(project.technical.problem),
              architecture: t(project.technical.architecture),
              tradeoffs: (project.technical.tradeoffs ?? []).map(t),
              skills: project.skills.flatMap((id) => skillName.get(id) ?? []),
              repo: project.links?.repo,
              demo: project.links?.demo,
            })
          : [],
      ),
    skills: skills.map(({ id, name, category, level }) => ({ id, name, category, level })),
  };
}

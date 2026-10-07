# ADR 0002: Composição dos microfrontends

- Status: **aceito** pelo autor em 2026-10-06
- Data: 2026-10-06

## Contexto

Três MFEs (React, Vue, Angular) precisam ser montados por um shell em JavaScript puro, e um app Next.js em export estático precisa conviver com eles no mesmo domínio. Não há servidor.

## Opções

| Critério | Module Federation | single-spa | Web Components como contrato |
|---|---|---|---|
| O que é | Compartilhamento de módulos em runtime entre builds | Framework de orquestração com ciclo de vida `bootstrap`, `mount`, `unmount` | Cada MFE registra um custom element; o shell cria a tag |
| Dependência extra em runtime | Runtime de federação em cada build | single-spa, mais um helper por framework e import maps | Nenhuma: é API do navegador |
| Acoplamento ao bundler | Alto (plugin por bundler) | Baixo | Nenhum |
| Next.js | O plugin `nextjs-mf` só cobre o Pages Router e está sendo descontinuado | Não se aplica a páginas pré-renderizadas | Não se aplica; Next.js fica fora da composição |
| Ganho principal | Compartilhar dependências entre MFEs | Vários frameworks na mesma tela, com troca sem recarregar | Contrato mínimo e padrão |
| O ganho serve aqui? | Não: os três MFEs usam frameworks diferentes, não há o que compartilhar | Pouco: só um MFE por rota | Sim |

## Decisão recomendada

**Web Components como contrato de integração**, sem Module Federation e sem single-spa. Concorda com a inclinação do autor; a documentação não contradiz.

- Cada MFE gera um bundle ES que registra um custom element (`<mfe-recrutador>`, `<mfe-tecnico>`, `<mfe-clientes>`).
- O shell tem um manifesto `rota -> { script, tag }`, carrega o script com `import()` e insere a tag.
- Comunicação só por `CustomEvent` tipado em `packages/contracts`.

Como cada framework expõe o elemento:

| Framework | Mecanismo | Observação da doc |
|---|---|---|
| Vue | `defineCustomElement` | Custo base de cerca de 16 kB; estilos vão para o shadow root |
| Angular | `createCustomElement` de `@angular/elements` | A doc pede cuidado ao remover e reinserir o elemento no DOM |
| React | Não tem API própria; uma classe `HTMLElement` pequena chama `createRoot` em `connectedCallback` e `unmount` em `disconnectedCallback` | Escrita à mão, poucas linhas |

Por causa do aviso do Angular, o shell nunca reinsere um elemento de MFE: ao sair da área, remove; ao voltar, cria outro.

## Next.js em export estático ao lado do shell

Verificado na doc do Next.js 16.4:

- `output: 'export'` gera um HTML por rota em `out/`, hospedável em qualquer servidor de arquivos estáticos.
- Em export estático **não funcionam** `rewrites`, `redirects`, `headers` e `proxy`. O Next.js não pode rotear para os outros apps; o roteamento entre apps é só por caminho, no host.
- O guia de Multi-Zones descreve o mesmo modelo: aplicações diferentes servem conjuntos de caminhos diferentes no mesmo domínio, podem usar frameworks diferentes, e a navegação entre zonas é uma navegação completa, com `<a>` em vez de `<Link>`.

Decisão:

- O Next.js é dono de `/`, `/comunidade`, `/como-foi-feito` e das versões por idioma. O shell é dono de `/recrutador`, `/tecnico`, `/clientes` e das versões por idioma.
- Nenhum caminho pertence a dois apps. Um script de montagem falha se dois apps emitirem o mesmo arquivo.
- `trailingSlash: true` no Next.js, para gerar `rota/index.html`, que todo host estático resolve sem regra.
- Idiomas no Next.js por segmento dinâmico com `generateStaticParams`, já que rotas dinâmicas sem ele não são exportáveis.
- O build do shell também gera um HTML por rota e idioma. Assim toda URL conhecida tem um arquivo real.

## O que isso exige da hospedagem

| Exigência | Obrigatória? |
|---|---|
| Servir um diretório único de arquivos estáticos | Sim |
| Resolver `/rota/` para `rota/index.html` | Sim (todo host faz) |
| Servir `404.html` | Sim |
| Regra de reescrita por caminho (`/tecnico/*` para `/tecnico/index.html`) | Só se um MFE tiver sub-rotas não geradas no build, como detalhe de projeto. Recomendado ter. |
| Cabeçalhos de cache para arquivos com hash | Recomendado |

## Consequências

- Cada MFE carrega o runtime do próprio framework; nada é compartilhado entre eles. Aceitável porque só um carrega por rota.
- Trocar entre página Next.js e página do shell recarrega o documento.
- As três áreas de MFE não têm conteúdo no HTML inicial, só título e descrição. O conteúdo indexável fica no Next.js.
- O desenvolvimento local precisa de um proxy por caminho para ver tudo junto; cada app também roda sozinho.
- Shadow DOM ou light DOM na raiz de cada MFE fica para o bootstrap. Os tokens funcionam nos dois casos, porque propriedades CSS customizadas atravessam o shadow DOM.

## Fontes

- [Next.js: static exports](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js: multi-zones](https://nextjs.org/docs/app/guides/multi-zones)
- [Vue e Web Components](https://vuejs.org/guide/extras/web-components)
- [Angular elements](https://angular.dev/guide/elements)
- [React: custom HTML elements](https://react.dev/reference/react-dom/components#custom-html-elements)
- [single-spa: visão geral](https://single-spa.js.org/docs/getting-started-overview/)
- [Vercel Community: Module Federation com App Router](https://community.vercel.com/t/can-i-use-module-federation-with-next-js-app-router/6132)

Não verificado: a página oficial do Module Federation sobre Next.js retornou 404; a situação do `nextjs-mf` vem de resultado de busca, não da doc primária.

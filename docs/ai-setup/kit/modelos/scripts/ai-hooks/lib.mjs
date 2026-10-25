// Leitura e resposta de hooks de edição, iguais para Claude Code, Codex CLI, Gemini CLI e
// Antigravity CLI. Cada ferramenta manda um JSON diferente pela entrada padrão; aqui ele vira
// { tool, files }, com os caminhos relativos à raiz do repositório.

import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function stdin() {
  let text = '';
  for await (const chunk of process.stdin) text += chunk;
  return text;
}

/** Caminhos citados num patch do Codex (`*** Update File: caminho`). */
function patchFiles(patch) {
  const text = Array.isArray(patch) ? patch.join('\n') : String(patch ?? '');
  return [
    ...text.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$|^\*\*\* Move to: (.+)$/gm),
  ].map((match) => (match[1] ?? match[2]).trim());
}

/** @returns {Promise<{ tool: 'antigravity' | 'outra', files: string[], raw: object }>} */
export async function readEvent() {
  let raw = {};
  try {
    raw = JSON.parse((await stdin()) || '{}');
  } catch {
    return { tool: 'outra', files: [], raw };
  }

  let tool = 'outra';
  let paths;
  let base = raw.cwd ?? root;
  if (raw.toolCall) {
    // Antigravity: { toolCall: { name, args: { TargetFile } }, workspacePaths: [...] }
    tool = 'antigravity';
    const args = raw.toolCall.args ?? {};
    paths = [args.TargetFile ?? args.AbsolutePath ?? args.path].filter(Boolean);
    base = raw.workspacePaths?.[0] ?? root;
  } else if (raw.tool_name === 'apply_patch') {
    // Codex: o patch vem em tool_input.command.
    paths = patchFiles(raw.tool_input?.command);
  } else {
    // Claude (file_path, notebook_path) e Gemini (file_path).
    const input = raw.tool_input ?? {};
    paths = [input.file_path ?? input.notebook_path ?? input.path ?? input.absolute_path].filter(
      Boolean,
    );
  }

  const files = paths.map((path) =>
    relative(root, isAbsolute(path) ? path : resolve(base, path)).replace(/\\/g, '/'),
  );
  return { tool, files, raw };
}

/** Recusa a ação. Antigravity decide por JSON na saída padrão; as outras, por código 2. */
export function block(event, reason) {
  if (event.tool === 'antigravity') {
    process.stdout.write(JSON.stringify({ decision: 'deny', reason }));
    process.exit(0);
  }
  process.stderr.write(`${reason}\n`);
  process.exit(2);
}

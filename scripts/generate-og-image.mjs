import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outPath = join(repoRoot, 'apps/web-next/public/_home/og-image.png');

function fileToBase64(path, mime) {
  const buffer = readFileSync(path);
  return `data:${mime};base64,${buffer.toString('base64')}`;
}

const recruiterImg = fileToBase64(
  join(repoRoot, 'apps/web-next/public/_home/personas/recruiter.webp'),
  'image/webp',
);
const techImg = fileToBase64(
  join(repoRoot, 'apps/web-next/public/_home/personas/tech.webp'),
  'image/webp',
);
const clientImg = fileToBase64(
  join(repoRoot, 'apps/web-next/public/_home/personas/client.webp'),
  'image/webp',
);
const communityImg = fileToBase64(
  join(repoRoot, 'apps/web-next/public/_home/personas/community.webp'),
  'image/webp',
);

// Tenta ler a fonte do design system se existir
let fontBase64 = '';
const fontPath = join(
  repoRoot,
  'node_modules/@fontsource/m-plus-rounded-1c/files/m-plus-rounded-1c-latin-700-normal.woff2',
);
try {
  fontBase64 = fileToBase64(fontPath, 'font/woff2');
} catch {
  // Fallback para fontes do sistema se não encontrar o arquivo
}

const fontFaceCss = fontBase64
  ? `@font-face {
      font-family: 'M PLUS Rounded 1c';
      font-weight: 700;
      src: url('${fontBase64}') format('woff2');
    }`
  : '';

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    ${fontFaceCss}
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      background-color: #0b0e1b;
      font-family: 'M PLUS Rounded 1c', system-ui, -apple-system, sans-serif;
      color: #ffffff;
      position: relative;
      display: flex;
    }

    /* Fundo com gradientes e atmosfera de sakura RPG */
    .bg-gradient {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 85% 35%, rgba(217, 72, 122, 0.3) 0%, transparent 55%),
        radial-gradient(circle at 15% 85%, rgba(79, 192, 141, 0.18) 0%, transparent 45%),
        radial-gradient(circle at 50% 10%, rgba(97, 218, 251, 0.15) 0%, transparent 50%),
        linear-gradient(135deg, #0b0e1b 0%, #111528 50%, #171630 100%);
      z-index: 0;
    }

    /* Moldura externa sutil */
    .border-frame {
      position: absolute;
      inset: 16px;
      border: 1.5px solid rgba(246, 239, 217, 0.18);
      border-radius: 20px;
      pointer-events: none;
      z-index: 10;
    }

    .corner-decor {
      position: absolute;
      width: 12px;
      height: 12px;
      border-color: #ffd700;
      z-index: 11;
    }
    .c-tl { top: 22px; left: 22px; border-top: 3px solid #ffd700; border-left: 3px solid #ffd700; }
    .c-tr { top: 22px; right: 22px; border-top: 3px solid #ffd700; border-right: 3px solid #ffd700; }
    .c-bl { bottom: 22px; left: 22px; border-bottom: 3px solid #ffd700; border-left: 3px solid #ffd700; }
    .c-br { bottom: 22px; right: 22px; border-bottom: 3px solid #ffd700; border-right: 3px solid #ffd700; }

    /* Lado esquerdo: texto e identidade */
    .content {
      position: relative;
      z-index: 5;
      width: 650px;
      padding: 64px 0 64px 64px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #f6efd9;
      width: fit-content;
      backdrop-filter: blur(8px);
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ffd700;
      box-shadow: 0 0 8px #ffd700;
    }

    .title-group {
      margin-top: 18px;
    }
    .name {
      font-size: 68px;
      font-weight: 700;
      line-height: 1.05;
      letter-spacing: -0.02em;
      color: #ffffff;
      text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
    }
    .role {
      font-size: 32px;
      font-weight: 700;
      color: #f29bb5;
      margin-top: 8px;
      letter-spacing: -0.01em;
      text-shadow: 0 2px 10px rgba(242, 155, 181, 0.3);
    }

    .tagline {
      font-size: 19px;
      line-height: 1.45;
      color: #c3c8d2;
      margin-top: 16px;
      max-width: 540px;
    }

    .tech-stack {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 24px;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 6px 14px;
      background: rgba(15, 21, 53, 0.65);
      border: 1px solid rgba(195, 200, 210, 0.22);
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #eef0f4;
    }
    .chip-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .dot-vue { background: #4fc08d; box-shadow: 0 0 6px #4fc08d; }
    .dot-angular { background: #ff8087; box-shadow: 0 0 6px #ff8087; }
    .dot-react { background: #61dafb; box-shadow: 0 0 6px #61dafb; }
    .dot-next { background: #ffffff; box-shadow: 0 0 6px #ffffff; }

    .footer {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 16px;
      color: #93c5fd;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .footer-icon {
      display: inline-block;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid #93c5fd;
      position: relative;
    }
    .footer-icon::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 6px;
      height: 6px;
      background: #93c5fd;
      border-radius: 50%;
    }

    /* Lado direito: Personagens alinhados como equipe de RPG */
    .personas-stage {
      position: absolute;
      right: 28px;
      bottom: 16px;
      width: 540px;
      height: 590px;
      z-index: 4;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }

    .glow-pedestal {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      width: 480px;
      height: 60px;
      background: radial-gradient(ellipse at center, rgba(242, 155, 181, 0.4) 0%, rgba(255, 215, 0, 0.2) 40%, transparent 75%);
      filter: blur(14px);
      z-index: 1;
    }

    .p-figure {
      position: absolute;
      bottom: 0;
      filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.7));
    }
    .p-tech {
      left: 20px;
      height: 480px;
      z-index: 2;
      opacity: 0.95;
    }
    .p-client {
      left: 125px;
      height: 500px;
      z-index: 3;
      opacity: 0.98;
    }
    .p-community {
      right: 20px;
      height: 480px;
      z-index: 2;
      opacity: 0.95;
    }
    .p-recruiter {
      right: 120px;
      height: 540px;
      z-index: 5;
    }
  </style>
</head>
<body>
  <div class="bg-gradient"></div>
  <div class="border-frame"></div>
  <div class="corner-decor c-tl"></div>
  <div class="corner-decor c-tr"></div>
  <div class="corner-decor c-bl"></div>
  <div class="corner-decor c-br"></div>

  <div class="content">
    <div>
      <div class="badge">
        <span class="badge-dot"></span>
        <span>Portfólio 2027</span>
      </div>

      <div class="title-group">
        <h1 class="name">Dario Reis</h1>
        <div class="role">Software Engineer</div>
      </div>

      <p class="tagline">
        Desenvolvimento web full-stack, arquitetura front-end e microfrontends. Quatro áreas, quatro tecnologias, uma experiência unificada.
      </p>

      <div class="tech-stack">
        <span class="chip"><span class="chip-dot dot-next"></span>Next.js</span>
        <span class="chip"><span class="chip-dot dot-vue"></span>Vue</span>
        <span class="chip"><span class="chip-dot dot-angular"></span>Angular</span>
        <span class="chip"><span class="chip-dot dot-react"></span>React</span>
        <span class="chip">TypeScript</span>
        <span class="chip">Node.js</span>
      </div>
    </div>

    <div class="footer">
      <span class="footer-icon"></span>
      <span>2027.darioreis.dev</span>
    </div>
  </div>

  <div class="personas-stage">
    <div class="glow-pedestal"></div>
    <img class="p-figure p-tech" src="${techImg}" alt="Técnico" />
    <img class="p-figure p-client" src="${clientImg}" alt="Cliente" />
    <img class="p-figure p-community" src="${communityImg}" alt="Comunidade" />
    <img class="p-figure p-recruiter" src="${recruiterImg}" alt="Recrutador" />
  </div>
</body>
</html>`;

async function generate() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  await page.setContent(html, { waitUntil: 'networkidle' });
  // Pequena pausa para garantir renderização de fontes e imagens
  await page.waitForTimeout(300);

  await page.screenshot({
    path: outPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });

  await browser.close();
  console.log(`Imagem gerada com sucesso em: ${outPath}`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});

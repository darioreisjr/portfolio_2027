import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGroundTruth,
  buildSystemPrompt,
  FALLBACK_MESSAGES,
  handleChatMessage,
} from '../api/chat.ts';
import handler from '../api/chat.ts';

test('buildGroundTruth extrai dados reais publicados e descarta rascunhos', () => {
  const groundTruth = buildGroundTruth();

  assert.ok(groundTruth.includes('Dario Reis'));
  assert.ok(groundTruth.includes('Software Engineer'));
  assert.ok(groundTruth.includes('dev.darioreis@gmail.com'));
  assert.ok(groundTruth.includes('React'));
  assert.ok(groundTruth.includes('ProBrain'));
  assert.ok(groundTruth.includes('Portfólio 2026'));

  // Não deve conter exemplos de rascunho
  assert.strictEqual(groundTruth.includes('pessoa@example.com'), false);
  assert.strictEqual(groundTruth.includes('example.com/github'), false);
});

test('buildSystemPrompt gera persona da Airi e guardrails no idioma correto', () => {
  const promptPt = buildSystemPrompt('pt-BR');
  assert.match(promptPt, /Airi/);
  assert.match(promptPt, /GUARDRAILS E LIMITES ESTRITOS/);
  assert.match(promptPt, /pt-BR/);

  const promptEn = buildSystemPrompt('en');
  assert.match(promptEn, /en/);

  const promptEs = buildSystemPrompt('es');
  assert.match(promptEs, /es/);
});

test('handleChatMessage retorna fallback amigável quando GEMINI_API_KEY está ausente', async () => {
  const resPt = await handleChatMessage({
    message: 'Olá!',
    locale: 'pt-BR',
    apiKey: '',
  });

  assert.equal(resPt.fallback, true);
  assert.equal(resPt.reply, FALLBACK_MESSAGES['pt-BR']);

  const resEn = await handleChatMessage({
    message: 'Hi!',
    locale: 'en',
    apiKey: '',
  });

  assert.equal(resEn.fallback, true);
  assert.equal(resEn.reply, FALLBACK_MESSAGES['en']);
});

test('handler HTTP recusa métodos diferentes de POST', async () => {
  let statusCode = 0;
  let responseData = '';

  const fakeReq = { method: 'GET', headers: {} };
  const fakeRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await handler(fakeReq, fakeRes);
  assert.equal(statusCode, 405);
  assert.match(responseData.error, /Método não permitido/);
});

test('handler HTTP valida mensagem vazia', async () => {
  let statusCode = 0;
  let responseData = '';

  const fakeReq = {
    method: 'POST',
    body: { message: '' },
    headers: {},
  };
  const fakeRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  await handler(fakeReq, fakeRes);
  assert.equal(statusCode, 400);
  assert.match(responseData.error, /Mensagem vazia/);
});

test('handler HTTP responde com 200 e mensagem fallback quando sem chave de API', async () => {
  let statusCode = 0;
  let responseData = '';

  const fakeReq = {
    method: 'POST',
    body: { message: 'Quem é o Dario?', locale: 'pt-BR' },
    headers: {},
  };
  const fakeRes = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  // Força sem chave
  const oldKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    await handler(fakeReq, fakeRes);
    assert.equal(statusCode, 200);
    assert.equal(responseData.fallback, true);
    assert.equal(responseData.reply, FALLBACK_MESSAGES['pt-BR']);
  } finally {
    if (oldKey) process.env.GEMINI_API_KEY = oldKey;
  }
});

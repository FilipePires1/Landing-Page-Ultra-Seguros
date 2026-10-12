/**
 * Servidor do site da Ultra Seguros e Consórcios.
 *
 * • Serve o site estático (index, /cotacao, assets)
 * • Expõe POST /api/cotacao → encaminha ao sistema atual (ver integracao.js)
 *
 * Execução (sem dependências externas):
 *   node server.js
 *   PORT=8080 node server.js
 *
 * Variáveis de integração: ver server/integracao.js e docs/INTEGRACAO.md
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { enviarParaSistema, reprocessarFila, validarPayload, registrarLog } from './integracao.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const ADMIN_TOKEN = process.env.ULTRA_ADMIN_TOKEN || '';
const TAM_MAX = 64 * 1024; // 64 KB

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

function responder(res, status, corpo, tipo = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': tipo,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': tipo.includes('json') ? 'no-store' : 'public, max-age=300'
  });
  res.end(corpo);
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let tamanho = 0;
    const pedacos = [];
    req.on('data', (c) => {
      tamanho += c.length;
      if (tamanho > TAM_MAX) {
        reject(new Error('Payload muito grande.'));
        req.destroy();
        return;
      }
      pedacos.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(pedacos).toString('utf8')));
    req.on('error', reject);
  });
}

/** Resolve o caminho estático evitando traversal. */
function caminhoSeguro(urlPath) {
  const limpo = decodeURIComponent(urlPath.split('?')[0]);
  const candidato = path.normalize(path.join(RAIZ, limpo));
  if (!candidato.startsWith(RAIZ)) return null;
  return candidato;
}

function servirEstatico(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  let alvo = caminhoSeguro(urlPath);
  if (!alvo) return responder(res, 403, 'Acesso negado.', 'text/plain; charset=utf-8');

  // Rota amiga: /cotacao → cotacao.html
  if (!path.extname(alvo) && fs.existsSync(`${alvo}.html`)) alvo = `${alvo}.html`;

  if (fs.existsSync(alvo) && fs.statSync(alvo).isDirectory()) {
    alvo = path.join(alvo, 'index.html');
  }

  if (!fs.existsSync(alvo) || !fs.statSync(alvo).isFile()) {
    return responder(res, 404, 'Página não encontrada.', 'text/plain; charset=utf-8');
  }

  // Nunca servir a fila de leads / logs
  if (alvo.startsWith(path.join(RAIZ, 'server', 'data'))) {
    return responder(res, 403, 'Acesso negado.', 'text/plain; charset=utf-8');
  }

  const ext = path.extname(alvo).toLowerCase();
  const tipo = MIME[ext] || 'application/octet-stream';

  // Páginas HTML sempre frescas
  const cache = ext === '.html' ? 'no-store' : 'public, max-age=3600';

  res.writeHead(200, { 'Content-Type': tipo, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' });
  fs.createReadStream(alvo).pipe(res);
}

async function rotasAPI(req, res, url) {
  /* ---------------------------------------------------------- GET /health */
  if (req.method === 'GET' && url.pathname === '/api/health') {
    return responder(res, 200, JSON.stringify({ ok: true, servico: 'ultra-cotacao' }));
  }

  /* ------------------------------------------------------ POST /api/cotacao */
  if (req.method === 'POST' && url.pathname === '/api/cotacao') {
    let bruto;
    try {
      bruto = await lerCorpo(req);
    } catch (e) {
      return responder(res, 413, JSON.stringify({ ok: false, erro: e.message }));
    }

    let body;
    try {
      body = JSON.parse(bruto);
    } catch {
      return responder(res, 400, JSON.stringify({ ok: false, erro: 'JSON inválido.' }));
    }

    const erroValidacao = validarPayload(body);
    if (erroValidacao) {
      registrarLog('VALIDACAO', { erro: erroValidacao });
      return responder(res, 422, JSON.stringify({ ok: false, erro: erroValidacao }));
    }

    try {
      const r = await enviarParaSistema(body);
      registrarLog('RECEBIDO', { nome: body.lead.nome_cliente, produto: body.lead.produto, destino: r.destino });
      return responder(res, 200, JSON.stringify({ ok: true, destino: r.destino }));
    } catch (e) {
      registrarLog('EXCECAO', { erro: String(e) });
      return responder(res, 500, JSON.stringify({ ok: false, erro: 'Falha ao processar a solicitação.' }));
    }
  }

  /* ---------------------------------------- POST /api/reprocessar-fila */
  if (req.method === 'POST' && url.pathname === '/api/reprocessar-fila') {
    if (!ADMIN_TOKEN) {
      return responder(res, 403, JSON.stringify({ ok: false, erro: 'Defina ULTRA_ADMIN_TOKEN para usar este recurso.' }));
    }
    if (req.headers['x-admin-token'] !== ADMIN_TOKEN) {
      return responder(res, 401, JSON.stringify({ ok: false, erro: 'Token inválido.' }));
    }
    const r = await reprocessarFila();
    return responder(res, 200, JSON.stringify({ ok: true, ...r }));
  }

  return responder(res, 404, JSON.stringify({ ok: false, erro: 'Rota não encontrada.' }));
}

const servidor = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname.startsWith('/api/')) {
      return await rotasAPI(req, res, url);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return responder(res, 405, 'Método não permitido.', 'text/plain; charset=utf-8');
    }

    return servirEstatico(req, res);
  } catch (e) {
    registrarLog('ERRO_INTERNO', { erro: String(e) });
    return responder(res, 500, 'Erro interno.', 'text/plain; charset=utf-8');
  }
});

servidor.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`\n  Ultra Seguros e Consórcios`);
  console.log(`  Site:      http://localhost:${PORT}`);
  console.log(`  Cotação:   http://localhost:${PORT}/cotacao`);
  console.log(`  API:       http://localhost:${PORT}/api/cotacao\n`);
});

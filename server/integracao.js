/**
 * Camada de integração com o sistema atual da Ultra.
 *
 * FLUXO:
 *   FORMULÁRIO DO SITE  →  POST /api/cotacao  →  este módulo  →  SISTEMA ATUAL  →  EQUIPE
 *
 * O frontend nunca enxerga credenciais: tudo acontece aqui, no servidor.
 *
 * CONFIGURAÇÃO (variáveis de ambiente):
 *   ULTRA_WEBHOOK_URL   → endereço do webhook do sistema atual
 *   ULTRA_WEBHOOK_TOKEN → token/credencial (enviado como Authorization: Bearer)
 *   ULTRA_API_URL       → alternativa: endpoint REST do sistema atual
 *   ULTRA_API_KEY       → chave da API (enviada no header X-API-Key)
 *   ULTRA_TIMEOUT_MS    → timeout do envio (padrão 10000)
 *
 * Se nenhuma URL for informada, o lead é gravado na fila local
 * (data/fila_leads.jsonl) e reprocessado quando a integração for configurada.
 * Nenhum lead é perdido.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapearLead } from './map.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
const FILA = path.join(DATA_DIR, 'fila_leads.jsonl');
const LOG = path.join(DATA_DIR, 'log_integracao.log');

const CONFIG = {
  webhookUrl: process.env.ULTRA_WEBHOOK_URL || '',
  webhookToken: process.env.ULTRA_WEBHOOK_TOKEN || '',
  apiUrl: process.env.ULTRA_API_URL || '',
  apiKey: process.env.ULTRA_API_KEY || '',
  timeout: Number(process.env.ULTRA_TIMEOUT_MS || 10000)
};

function garantirData() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function registrarLog(nivel, dados) {
  try {
    garantirData();
    fs.appendFileSync(LOG, `${new Date().toISOString()} [${nivel}] ${JSON.stringify(dados)}\n`);
  } catch {
    /* logging é melhor esforço */
  }
}

function gravarFila(payload) {
  garantirData();
  fs.appendFileSync(FILA, `${JSON.stringify(payload)}\n`);
}

/** Validação básica do payload recebido do site. */
export function validarPayload(body) {
  if (!body || typeof body !== 'object') return 'Payload inválido.';
  if (!body.lead || typeof body.lead !== 'object') return 'Lead ausente.';
  if (!body.lead.nome_cliente) return 'Campo obrigatório ausente: nome_cliente.';
  if (!body.lead.telefone) return 'Campo obrigatório ausente: telefone.';
  if (!body.lead.email) return 'Campo obrigatório ausente: email.';
  if (!body.lead.produto) return 'Campo obrigatório ausente: produto.';
  return null;
}

async function postJSON(url, payload, headers) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeout);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const texto = await res.text().catch(() => '');
    return { ok: res.ok, status: res.status, resposta: texto.slice(0, 2000) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Dispara o corpo já formatado para o sistema atual (sem gravar fila).
 * @returns {Promise<{ok:boolean, destino:string, detalhe?:string}>}
 */
async function disparar(corpo) {
  // 1) Webhook (preferencial)
  if (CONFIG.webhookUrl) {
    try {
      const headers = {};
      if (CONFIG.webhookToken) headers.Authorization = `Bearer ${CONFIG.webhookToken}`;
      const r = await postJSON(CONFIG.webhookUrl, corpo, headers);
      if (r.ok) return { ok: true, destino: 'webhook' };
      registrarLog('ERRO_WEBHOOK', { status: r.status, resposta: r.resposta });
      return { ok: false, destino: 'webhook', detalhe: `HTTP ${r.status}` };
    } catch (e) {
      registrarLog('EXCECAO_WEBHOOK', { erro: String(e) });
      return { ok: false, destino: 'webhook', detalhe: String(e) };
    }
  }

  // 2) API REST
  if (CONFIG.apiUrl) {
    try {
      const headers = {};
      if (CONFIG.apiKey) headers['X-API-Key'] = CONFIG.apiKey;
      const r = await postJSON(CONFIG.apiUrl, corpo, headers);
      if (r.ok) return { ok: true, destino: 'api' };
      registrarLog('ERRO_API', { status: r.status, resposta: r.resposta });
      return { ok: false, destino: 'api', detalhe: `HTTP ${r.status}` };
    } catch (e) {
      registrarLog('EXCECAO_API', { erro: String(e) });
      return { ok: false, destino: 'api', detalhe: String(e) };
    }
  }

  // 3) Integração ainda não configurada
  return { ok: false, destino: 'nao_configurado', detalhe: 'ULTRA_WEBHOOK_URL/ULTRA_API_URL ausente.' };
}

/**
 * Envia o lead para o sistema atual.
 * Falhas são gravadas na fila local para reprocessamento posterior.
 * @param {object} payload payload vindo do site (lead + meta)
 * @returns {Promise<{ok:boolean, destino:string, detalhe?:string}>}
 */
export async function enviarParaSistema(payload) {
  const corpo = mapearLead(payload);
  const r = await disparar(corpo);

  if (r.ok) return r;

  gravarFila(payload);
  registrarLog('FILA_LOCAL', {
    nome: payload.lead?.nome_cliente,
    produto: payload.lead?.produto,
    motivo: r.detalhe
  });

  // Sem integração configurada o site segue funcionando: o lead fica guardado.
  if (r.destino === 'nao_configurado') return { ok: true, destino: 'fila_local', detalhe: r.detalhe };
  return { ok: false, destino: r.destino, detalhe: r.detalhe };
}

/** Reprocessa a fila local (chamado manualmente ou por job). */
export async function reprocessarFila() {
  if (!fs.existsSync(FILA)) return { processados: 0, restantes: 0 };

  const linhas = fs.readFileSync(FILA, 'utf8').split('\n').filter(Boolean);
  const restantes = [];

  for (const linha of linhas) {
    let payload;
    try { payload = JSON.parse(linha); } catch { continue; }

    const r = await disparar(mapearLead(payload));
    if (r.ok) {
      registrarLog('REPROCESSADO', { nome: payload.lead?.nome_cliente, destino: r.destino });
    } else {
      restantes.push(linha);
    }
  }

  fs.writeFileSync(FILA, restantes.length ? `${restantes.join('\n')}\n` : '');
  return { processados: linhas.length - restantes.length, restantes: restantes.length };
}

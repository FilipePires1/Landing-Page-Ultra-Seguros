/**
 * Camada de envio da cotação.
 *
 * O FRONTEND NÃO TEM CHAVES NEM CREDENCIAIS.
 * Ele apenas envia o payload estruturado para o backend do próprio site
 * (POST /api/cotacao), que é quem conversa com o sistema atual da Ultra.
 */
import { SITE } from './config.js';
import { montarPayload } from './field-map.js';
import { capturarOrigem } from './origin.js';

const FILA_KEY = 'ultra_leads_pendentes';

function lerFila() {
  try {
    return JSON.parse(localStorage.getItem(FILA_KEY) || '[]');
  } catch {
    return [];
  }
}

function guardarPendente(payload) {
  try {
    const fila = lerFila();
    fila.push(payload);
    localStorage.setItem(FILA_KEY, JSON.stringify(fila));
  } catch {
    /* armazenamento indisponível */
  }
}

/** Tenta reenviar leads que falharam anteriormente. */
export async function reenviarPendentes() {
  const fila = lerFila();
  if (!fila.length) return;

  const restantes = [];
  for (const payload of fila) {
    try {
      const res = await fetch(SITE.apiCotacao, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) restantes.push(payload);
    } catch {
      restantes.push(payload);
    }
  }
  localStorage.setItem(FILA_KEY, JSON.stringify(restantes));
}

/**
 * Envia a cotação.
 * @param {object} answers respostas do formulário
 * @param {object} extras  metadados adicionais
 * @returns {Promise<{ok:boolean, motivo?:string}>}
 */
export async function enviarCotacao(answers, extras = {}) {
  const payload = montarPayload(answers, capturarOrigem(), {
    origem_formulario: window.location.pathname,
    userAgent: navigator.userAgent,
    ...extras
  });

  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(SITE.apiCotacao, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        localStorage.removeItem(FILA_KEY);
        return { ok: true };
      }
    } catch {
      /* tenta novamente */
    }
  }

  guardarPendente(payload);
  return { ok: false, motivo: 'falha_envio' };
}

/** Monta uma mensagem de WhatsApp com o resumo da solicitação (fallback humano). */
export function mensagemWhatsApp(answers) {
  const linhas = ['Olá! Acabei de fazer uma cotação no site da Ultra e gostaria de continuar.'];

  const rotulos = {
    produto: 'Produto',
    veiculo: 'Veículo',
    ano_veiculo: 'Ano',
    uso_veiculo: 'Uso',
    tipo_imovel: 'Imóvel',
    destino: 'Destino',
    consorcio_objetivo: 'Objetivo',
    consorcio_valor: 'Valor',
    nome: 'Nome',
    whatsapp: 'WhatsApp',
    email: 'E-mail'
  };

  Object.entries(rotulos).forEach(([k, label]) => {
    if (answers[k]) linhas.push(`${label}: ${answers[k]}`);
  });

  return linhas.join('\n');
}

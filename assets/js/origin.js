/**
 * Identificação da origem do lead.
 * Captura parâmetros de campanha (UTM, ref, clique em anúncio) e os
 * preserva durante todo o preenchimento do formulário.
 */

const STORAGE_KEY = 'ultra_lead_origem';

const REFS_CONHECIDOS = [
  { match: /instagram/i, valor: 'Instagram' },
  { match: /facebook|fb\b/i, valor: 'Facebook' },
  { match: /google/i, valor: 'Google' },
  { match: /bing/i, valor: 'Bing' },
  { match: /whatsapp/i, valor: 'WhatsApp' },
  { match: /linkedin/i, valor: 'LinkedIn' },
  { match: /youtube/i, valor: 'YouTube' },
  { match: /tiktok/i, valor: 'TikTok' },
  { match: /x\.com|twitter/i, valor: 'X (Twitter)' }
];

function deduzirOrigem(referrer, params) {
  const forcats = [
    params.get('utm_source'),
    params.get('origem'),
    params.get('ref')
  ].filter(Boolean);

  if (forcats.length) return forcats[0];

  if (!referrer) return 'Acesso direto';

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    const conhecido = REFS_CONHECIDOS.find((r) => r.match.test(host));
    if (conhecido) return conhecido.valor;
    return host;
  } catch {
    return 'Acesso direto';
  }
}

/**
 * Coleta (uma única vez) e persiste os parâmetros de origem da visita.
 * @returns {object} dados de origem a serem enviados junto do lead
 */
export function capturarOrigem() {
  try {
    const salvo = sessionStorage.getItem(STORAGE_KEY);
    if (salvo) return JSON.parse(salvo);
  } catch {
    /* sessionStorage indisponível */
  }

  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer || '';

  const origem = {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_term: params.get('utm_term') || '',
    utm_content: params.get('utm_content') || '',
    ref: params.get('ref') || '',
    gclid: params.get('gclid') || '',
    fbclid: params.get('fbclid') || '',
    landing_page: window.location.origin + window.location.pathname,
    origem_lead: deduzirOrigem(referrer, params),
    referrer: referrer,
    primeira_visita: new Date().toISOString()
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(origem));
  } catch {
    /* ignora */
  }

  return origem;
}

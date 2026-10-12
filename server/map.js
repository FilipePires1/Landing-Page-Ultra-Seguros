/**
 * MAPA DE CAMPOS — lado servidor (fonte da verdade da integração).
 *
 * O frontend envia os campos com os nomes visuais do site.
 * Aqui eles são convertidos para os campos do sistema atual da Ultra.
 *
 * ALTERAÇÕES NO SISTEMA EXTERNO → altere SOMENTE este arquivo.
 */

/** Campo do site → campo do sistema atual. */
export const FIELD_MAP = {
  produto: 'produto',
  produto_outro: 'detalhes_produto',

  nome: 'nome_cliente',
  whatsapp: 'telefone',
  email: 'email',
  cidade: 'cidade',
  bairro: 'bairro',

  // Seguro auto
  veiculo: 'veiculo',
  ano_veiculo: 'ano_veiculo',
  uso_veiculo: 'uso_veiculo',
  veiculo_possui_seguro: 'possui_seguro',

  // Seguro residencial
  tipo_imovel: 'tipo_imovel',
  situacao_imovel: 'situacao_imovel',
  imovel_possui_seguro: 'possui_seguro',

  // Vida / saúde
  para_quem: 'para_quem',
  faixa_etaria: 'faixa_etaria',
  cobertura_desejada: 'cobertura_desejada',
  numero_pessoas: 'numero_pessoas',
  cidade_plano: 'cidade',

  // Empresarial
  nome_empresa: 'nome_empresa',
  segmento: 'segmento',
  cidade_empresa: 'cidade',
  funcionarios: 'numero_funcionarios',
  protecao_desejada: 'tipo_seguro',
  empresa_possui_seguro: 'possui_seguro',

  // Viagem
  destino: 'destino',
  data_partida: 'data_partida',
  duracao_viagem: 'duracao',
  viajantes: 'numero_viajantes',
  tipo_viagem: 'tipo_viagem',
  atividade_risco: 'atividade_risco',

  // Consórcio
  consorcio_objetivo: 'bem_desejado',
  outro_bem: 'bem_desejado',
  consorcio_valor: 'valor_desejado',
  consorcio_prazo: 'prazo_contemplacao',
  consorcio_possui: 'possui_consorcio',

  // Genéricos
  prioridade: 'prioridade',
  observacoes: 'observacoes'
};

/** Rótulos legíveis para o produto (evita mandar "auto" cru, se preferir). */
export const ROTULOS_PRODUTO = {
  auto: 'Seguro Auto',
  residencial: 'Seguro Residencial',
  vida: 'Seguro de Vida',
  empresarial: 'Seguro Empresarial',
  saude: 'Seguro Saúde',
  viagem: 'Seguro Viagem',
  consorcio: 'Consórcio',
  outro: 'Outro Seguro'
};

/** Converte o payload do site para o formato do sistema atual. */
export function mapearLead(payload = {}) {
  const lead = { ...(payload.lead || {}) };
  const meta = { ...(payload.meta || {}) };

  const sistema = {};

  Object.entries(lead).forEach(([chave, valor]) => {
    if (valor === '' || valor === null || valor === undefined) return;
    if (Array.isArray(valor) && !valor.length) return;
    const campo = FIELD_MAP[chave] || chave;
    sistema[campo] = Array.isArray(valor) ? valor.join(' | ') : valor;
  });

  if (sistema.produto && ROTULOS_PRODUTO[sistema.produto]) {
    sistema.produto = ROTULOS_PRODUTO[sistema.produto];
  }

  // Identificação da origem do lead — sempre acompanhando a cotação
  sistema.origem = meta.origem_lead || 'Acesso direto';
  if (meta.utm_source) sistema.utm_source = meta.utm_source;
  if (meta.utm_medium) sistema.utm_medium = meta.utm_medium;
  if (meta.utm_campaign) sistema.utm_campaign = meta.utm_campaign;
  if (meta.ref) sistema.ref = meta.ref;
  if (meta.landing_page) sistema.landing_page = meta.landing_page;

  return {
    lead: sistema,
    // Mantém os metadados brutos para auditoria/integrações futuras
    meta,
    origem: 'site_ultra_cotacao',
    versao_mapa: payload.versao_mapa || '1.0',
    enviado_em: new Date().toISOString()
  };
}

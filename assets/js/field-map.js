/**
 * MAPA DE CAMPOS — isolado da interface.
 *
 * Este arquivo é a única ponte entre o que o usuário digita no site
 * e o campo correspondente no sistema atual da Ultra.
 *
 * Quando o sistema externo mudar o nome de um campo, altere SOMENTE aqui.
 * Nenhum componente de interface precisa ser reconstruído.
 */

/** Campos visuais -> campos do sistema atual. */
export const FIELD_MAP = {
  produto: 'produto',
  detalhes_produto: 'detalhes_produto',
  produto_outro: 'detalhes_produto',

  nome: 'nome_cliente',
  whatsapp: 'telefone',
  email: 'email',
  cidade: 'cidade',

  // Seguro auto
  veiculo: 'veiculo',
  ano_veiculo: 'ano_veiculo',
  uso_veiculo: 'uso_veiculo',
  veiculo_possui_seguro: 'possui_seguro',

  // Seguro residencial
  tipo_imovel: 'tipo_imovel',
  situacao_imovel: 'situacao_imovel',
  imovel_possui_seguro: 'possui_seguro',

  // Seguro de vida / saúde
  para_quem: 'para_quem',
  faixa_etaria: 'faixa_etaria',
  cobertura_desejada: 'cobertura_desejada',
  numero_pessoas: 'numero_pessoas',
  cidade_plano: 'cidade',

  // Seguro empresarial
  nome_empresa: 'nome_empresa',
  segmento: 'segmento',
  cidade_empresa: 'cidade',
  funcionarios: 'numero_funcionarios',
  protecao_desejada: 'tipo_seguro',
  empresa_possui_seguro: 'possui_seguro',

  // Seguro viagem
  destino: 'destino',
  data_partida: 'data_partida',
  duracao_viagem: 'duracao',
  viajantes: 'numero_viajantes',
  tipo_viagem: 'tipo_viagem',
  atividade_risco: 'atividade_risco',

  // Consórcio
  consorcio_objetivo: 'bem_desejado',
  consorcio_valor: 'valor_desejado',
  consorcio_prazo: 'prazo_contemplacao',
  consorcio_possui: 'possui_consorcio',
  outro_bem: 'bem_desejado',

  // Genéricos
  prioridade: 'prioridade',
  observacoes: 'observacoes',
  bairro: 'bairro'
};

/** Lista fixa de chaves que sempre acompanham o lead (metadados). */
export const META_KEYS = [
  'origem_lead',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'gclid',
  'fbclid',
  'landing_page',
  'referrer',
  'primeira_visita'
];

/** Rótulos amigáveis para a tela de resumo. */
export const LABELS = {
  produto: 'Produto',
  nome: 'Nome completo',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  cidade: 'Cidade',
  veiculo: 'Veículo',
  ano_veiculo: 'Ano',
  uso_veiculo: 'Uso',
  veiculo_possui_seguro: 'Possui seguro',
  tipo_imovel: 'Imóvel',
  situacao_imovel: 'Situação',
  imovel_possui_seguro: 'Proteção atual',
  para_quem: 'Para quem',
  faixa_etaria: 'Faixa etária',
  cobertura_desejada: 'Cobertura',
  numero_pessoas: 'Pessoas',
  cidade_plano: 'Cidade',
  nome_empresa: 'Empresa',
  segmento: 'Segmento',
  cidade_empresa: 'Cidade',
  funcionarios: 'Funcionários',
  protecao_desejada: 'Proteções',
  empresa_possui_seguro: 'Possui seguro',
  destino: 'Destino',
  data_partida: 'Partida',
  duracao_viagem: 'Duração',
  viajantes: 'Viajantes',
  tipo_viagem: 'Tipo de viagem',
  atividade_risco: 'Atividade de risco',
  consorcio_objetivo: 'Objetivo',
  outro_bem: 'Bem desejado',
  consorcio_valor: 'Valor buscado',
  consorcio_prazo: 'Contemplação',
  consorcio_possui: 'Já possui consórcio',
  prioridade: 'Prioridade',
  observacoes: 'Observações',
  bairro: 'Bairro',
  produto_outro: 'Tipo de seguro'
};

/**
 * Converte as respostas do formulário no payload enviado ao backend.
 * @param {object} answers respostas visuais
 * @param {object} origem  metadados de campanha/origem
 * @param {object} extras  identificadores extras (id da página, versão do fluxo)
 */
export function montarPayload(answers, origem = {}, extras = {}) {
  const lead = {};

  Object.entries(answers).forEach(([chaveVisual, valor]) => {
    if (valor === '' || valor === null || valor === undefined) return;
    const campoSistema = FIELD_MAP[chaveVisual] || chaveVisual;
    lead[campoSistema] = valor;
  });

  const meta = { ...extras };
  META_KEYS.forEach((k) => {
    if (origem[k] !== undefined && origem[k] !== '') meta[k] = origem[k];
  });

  return {
    lead,
    meta,
    versao_mapa: '1.0',
    recebido_em: new Date().toISOString()
  };
}

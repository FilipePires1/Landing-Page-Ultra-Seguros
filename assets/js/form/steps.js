/**
 * DEFINIÇÃO DOS FLUXOS DE COTAÇÃO.
 *
 * Cada produto possui seu próprio conjunto de etapas, na ordem em que o
 * visitante deve vê-las. O motor (engine.js) monta a sequência a partir
 * das respostas já dadas — uma pergunta por vez.
 *
 * stages: objetivo -> detalhes -> perfil -> contato -> finalizacao
 */

const ANOS = (() => {
  const atual = new Date().getFullYear();
  const lista = [];
  for (let a = atual + 1; a >= 2000; a--) lista.push({ v: String(a), l: String(a) });
  return lista;
})();

const VEICULOS = [
  'Fiat Argo', 'Fiat Mobi', 'Fiat Toro', 'Fiat Strada', 'Fiat Pulse',
  'Chevrolet Onix', 'Chevrolet Onix Plus', 'Chevrolet Tracker', 'Chevrolet Cruze',
  'Volkswagen Gol', 'Volkswagen Polo', 'Volkswagen T-Cross', 'Volkswagen Voyage', 'Volkswagen Amarok',
  'Hyundai HB20', 'Hyundai HB20S', 'Hyundai Creta', 'Hyundai Tucson',
  'Toyota Corolla', 'Toyota Hilux', 'Toyota Yaris', 'Toyota RAV4',
  'Honda Civic', 'Honda HR-V', 'Honda Fit', 'Honda WR-V',
  'Renault Kwid', 'Renault Sandero', 'Renault Duster', 'Renault Stepway',
  'Jeep Renegade', 'Jeep Compass', 'Jeep Commander',
  'Ford Ka', 'Ford EcoSport', 'Ford Ranger', 'Ford Territory',
  'Nissan Kicks', 'Nissan Versa', 'Nissan Frontier',
  'Peugeot 208', 'Peugeot 2008', 'Peugeot 3008',
  'Citroën C3', 'Citroën C4 Cactus',
  'Toyota Corolla Cross', 'Volkswagen Nivus', 'Chevrolet Montana',
  'Moto Honda CG 160', 'Moto Honda Biz', 'Moto Yamaha Fazer', 'Moto Honda XRE 300'
];

const CIDADES_MG = [
  'Ipatinga', 'Ipaba', 'Santana do Paraíso', 'João Monlevade', ' Coronel Fabriciano',
  'Timóteo', 'Belo Horizonte', 'Sabará', 'Caeté', 'Nova Lima',
  'Sete Lagoas', 'Santa Luzia', 'Ribeirão das Neves', 'Betim', 'Contagem',
  'Caratinga', 'Governador Valadares', 'Ubá', 'Juiz de Fora', 'Vitória'
];

const FUNCIONARIOS = [
  { v: '1 a 5', l: '1 a 5' },
  { v: '6 a 20', l: '6 a 20' },
  { v: '21 a 50', l: '21 a 50' },
  { v: '51 a 200', l: '51 a 200' },
  { v: 'Mais de 200', l: 'Mais de 200' }
];

const FAIXAS_ETARIAS = [
  { v: 'Até 25 anos', l: 'Até 25 anos' },
  { v: '26 a 35 anos', l: '26 a 35 anos' },
  { v: '36 a 45 anos', l: '36 a 45 anos' },
  { v: '46 a 55 anos', l: '46 a 55 anos' },
  { v: '56 a 65 anos', l: '56 a 65 anos' },
  { v: 'Acima de 65 anos', l: 'Acima de 65 anos' }
];

const PRIORIDADE = [
  { v: 'Preço acessível', l: 'Preço acessível' },
  { v: 'Cobertura completa', l: 'Cobertura completa' },
  { v: 'Atendimento rápido', l: 'Atendimento rápido' },
  { v: 'Indicação de conhecidos', l: 'Indicação de conhecidos' }
];

export const PRODUTOS = [
  { v: 'auto', l: 'Seguro Auto', d: 'Proteção para o seu veículo e para você.' },
  { v: 'residencial', l: 'Seguro Residencial', d: 'Casa, apartamento ou imóvel comercial.' },
  { v: 'vida', l: 'Seguro de Vida', d: 'Tranquilidade para quem você ama.' },
  { v: 'empresarial', l: 'Seguro Empresarial', d: 'Proteção para o seu negócio.' },
  { v: 'saude', l: 'Seguro Saúde', d: 'Plano de saúde para você e sua família.' },
  { v: 'viagem', l: 'Seguro Viagem', d: 'Viaje com assistência no Brasil e no mundo.' },
  { v: 'consorcio', l: 'Consórcio', d: 'Conquiste seu carro, imóvel ou obra.' },
  { v: 'outro', l: 'Outro seguro', d: 'Não encontrou? Conte o que precisa.' }
];

const ROTULO_PRODUTO = Object.fromEntries(PRODUTOS.map((p) => [p.v, p.l]));

/** Etapas que vêm antes das perguntas específicas do produto. */
const stepProduto = () => ({
  id: 'produto',
  stage: 'objetivo',
  title: 'O que você deseja?',
  subtitle: 'Conte rapidamente o que você procura e nossa equipe cuidará do restante.',
  fields: [
    {
      name: 'produto',
      type: 'cards',
      required: true,
      autoAdvance: true,
      options: PRODUTOS.map((p) => ({ v: p.v, l: p.l, d: p.d }))
    }
  ]
});

const stepContato = () => ({
  id: 'contato',
  stage: 'contato',
  title: 'Para finalizar, como podemos falar com você?',
  subtitle: 'Nossa equipe utilizará essas informações para dar continuidade à sua solicitação.',
  fields: [
    { name: 'nome', type: 'text', label: 'Nome completo', required: true, placeholder: 'Como podemos te chamar?', autocomplete: 'name' },
    { name: 'whatsapp', type: 'tel', label: 'WhatsApp', required: true, placeholder: '(31) 99999-9999', autocomplete: 'tel', hint: 'Enviamos o retorno por aqui.' },
    { name: 'email', type: 'email', label: 'E-mail', required: true, placeholder: 'voce@email.com', autocomplete: 'email' },
    { name: 'cidade', type: 'text', label: 'Cidade', required: false, placeholder: 'Sua cidade', list: CIDADES_MG, hint: 'Opcional — ajuda a encontrar opções locais.' }
  ]
});

const stepRevisao = () => ({
  id: 'revisao',
  stage: 'finalizacao',
  title: 'Confira sua solicitação',
  subtitle: 'Se algo estiver errado, é só editar antes de enviar.',
  fields: [],
  review: true
});

/**
 * Perguntas específicas de cada produto.
 * Ordem do array = ordem de exibição.
 */
const FLUXOS = {
  auto: [
    {
      id: 'auto-veiculo',
      stage: 'detalhes',
      title: 'Qual é o veículo?',
      subtitle: 'Digite a marca e o modelo. Ex.: Honda Civic.',
      fields: [
        { name: 'veiculo', type: 'text', label: 'Veículo', required: true, placeholder: 'Marca e modelo', list: VEICULOS, listId: 'lista-veiculos', hint: 'Comece a digitar para ver sugestões.' }
      ]
    },
    {
      id: 'auto-ano',
      stage: 'detalhes',
      title: 'Qual o ano do veículo?',
      subtitle: 'Informe o ano/modelo do carro ou moto.',
      fields: [
        { name: 'ano_veiculo', type: 'select', label: 'Ano/modelo', required: true, placeholder: 'Selecione o ano', options: ANOS }
      ]
    },
    {
      id: 'auto-uso',
      stage: 'detalhes',
      title: 'Como você utiliza o veículo?',
      fields: [
        {
          name: 'uso_veiculo', type: 'cards', required: true, autoAdvance: true, size: 'sm',
          options: [
            { v: 'Particular', l: 'Particular' },
            { v: 'Trabalho', l: 'Trabalho' },
            { v: 'Aplicativo', l: 'Aplicativo' },
            { v: 'Outros', l: 'Outros' }
          ]
        }
      ]
    },
    {
      id: 'auto-perfil',
      stage: 'perfil',
      title: 'Últimos detalhes',
      subtitle: 'Só o necessário para montar uma proposta adequada.',
      fields: [
        { name: 'cidade', type: 'text', label: 'Cidade onde o veículo circula', required: true, placeholder: 'Ex.: Ipatinga', list: CIDADES_MG, listId: 'lista-cidades' },
        {
          name: 'veiculo_possui_seguro', type: 'cards', required: false, autoAdvance: true, size: 'sm',
          label: 'O veículo já possui seguro?',
          options: [
            { v: 'Sim', l: 'Sim' },
            { v: 'Não', l: 'Não' },
            { v: 'Estou pesquisando', l: 'Estou pesquisando' }
          ]
        }
      ]
    }
  ],

  residencial: [
    {
      id: 'res-tipo',
      stage: 'detalhes',
      title: 'O que você deseja proteger?',
      fields: [
        {
          name: 'tipo_imovel', type: 'cards', required: true, autoAdvance: true,
          options: [
            { v: 'Casa', l: 'Casa', d: 'Casa térrea ou em condomínio.' },
            { v: 'Apartamento', l: 'Apartamento', d: 'Unidade em edifício.' },
            { v: 'Imóvel comercial', l: 'Imóvel comercial', d: 'Loja, sala, galpão ou escritório.' }
          ]
        }
      ]
    },
    {
      id: 'res-situacao',
      stage: 'detalhes',
      title: 'O imóvel é próprio ou alugado?',
      fields: [
        {
          name: 'situacao_imovel', type: 'cards', required: true, autoAdvance: true, size: 'sm',
          options: [
            { v: 'Próprio', l: 'Próprio' },
            { v: 'Alugado', l: 'Alugado' },
            { v: 'Em processo de compra', l: 'Em processo de compra' }
          ]
        }
      ]
    },
    {
      id: 'res-local',
      stage: 'detalhes',
      title: 'Qual a localização?',
      subtitle: 'A cidade já nos ajuda a encontrar as melhores opções.',
      fields: [
        { name: 'cidade', type: 'text', label: 'Cidade', required: true, placeholder: 'Ex.: Ipatinga', list: CIDADES_MG, listId: 'lista-cidades' },
        { name: 'bairro', type: 'text', label: 'Bairro', required: false, placeholder: 'Opcional' }
      ]
    },
    {
      id: 'res-perfil',
      stage: 'perfil',
      title: 'Uma última pergunta',
      fields: [
        {
          name: 'imovel_possui_seguro', type: 'cards', required: false, autoAdvance: true, size: 'sm',
          label: 'O imóvel já tem alguma proteção hoje?',
          options: [
            { v: 'Sim', l: 'Sim' },
            { v: 'Não', l: 'Não' },
            { v: 'Não sei', l: 'Não sei' }
          ]
        },
        {
          name: 'prioridade', type: 'cards', required: false, autoAdvance: true, size: 'sm',
          label: 'O que é mais importante para você?',
          options: PRIORIDADE
        }
      ]
    }
  ],

  vida: [
    {
      id: 'vida-para-quem',
      stage: 'detalhes',
      title: 'Para quem você quer essa proteção?',
      fields: [
        {
          name: 'para_quem', type: 'cards', required: true, autoAdvance: true,
          options: [
            { v: 'Para mim', l: 'Para mim', d: 'Proteção individual.' },
            { v: 'Para mim e minha família', l: 'Para mim e minha família', d: 'Cobre você, cônjuge e filhos.' },
            { v: 'Para outra pessoa', l: 'Para outra pessoa', d: 'Filhos, pais ou dependentes.' }
          ]
        }
      ]
    },
    {
      id: 'vida-perfil',
      stage: 'perfil',
      title: 'Sobre o titular da proteção',
      subtitle: 'Essas informações ajudam a definir a cobertura ideal.',
      fields: [
        { name: 'faixa_etaria', type: 'select', label: 'Faixa etária', required: true, placeholder: 'Selecione', options: FAIXAS_ETARIAS },
        {
          name: 'cobertura_desejada', type: 'cards', required: false, autoAdvance: true, size: 'sm',
          label: 'Qual cobertura você procura?',
          options: [
            { v: 'Até R$ 50 mil', l: 'Até R$ 50 mil' },
            { v: 'R$ 50 mil a R$ 100 mil', l: 'R$ 50 mil a R$ 100 mil' },
            { v: 'R$ 100 mil a R$ 250 mil', l: 'R$ 100 mil a R$ 250 mil' },
            { v: 'Acima de R$ 250 mil', l: 'Acima de R$ 250 mil' }
          ]
        }
      ]
    }
  ],

  empresarial: [
    {
      id: 'emp-sobre',
      stage: 'detalhes',
      title: 'Conte um pouco sobre sua empresa',
      subtitle: 'Comece pelos dados básicos do negócio.',
      fields: [
        { name: 'nome_empresa', type: 'text', label: 'Nome da empresa', required: true, placeholder: 'Razão social ou nome fantasia', autocomplete: 'organization' },
        {
          name: 'segmento', type: 'select', label: 'Segmento', required: true, placeholder: 'Selecione o segmento',
          options: [
            { v: 'Comércio', l: 'Comércio' },
            { v: 'Serviços', l: 'Serviços' },
            { v: 'Indústria', l: 'Indústria' },
            { v: 'Construção civil', l: 'Construção civil' },
            { v: 'Agronegócio', l: 'Agronegócio' },
            { v: 'Saúde', l: 'Saúde' },
            { v: 'Tecnologia', l: 'Tecnologia' },
            { v: 'Transporte e logística', l: 'Transporte e logística' },
            { v: 'Outro', l: 'Outro' }
          ]
        },
        { name: 'cidade_empresa', type: 'text', label: 'Cidade', required: true, placeholder: 'Ex.: Ipatinga', list: CIDADES_MG, listId: 'lista-cidades' }
      ]
    },
    {
      id: 'emp-protecao',
      stage: 'detalhes',
      title: 'O que você precisa proteger?',
      fields: [
        { name: 'funcionarios', type: 'select', label: 'Número aproximado de funcionários', required: true, placeholder: 'Selecione', options: FUNCIONARIOS },
        {
          name: 'protecao_desejada', type: 'multi', required: true, label: 'Tipo de proteção desejada',
          hint: 'Você pode marcar mais de uma opção.',
          options: [
            { v: 'Patrimônio e equipamentos', l: 'Patrimônio e equipamentos' },
            { v: 'Responsabilidade civil', l: 'Responsabilidade civil' },
            { v: 'Empresarial (equipe)', l: 'Empresarial (equipe)' },
            { v: 'Frota de veículos', l: 'Frota de veículos' },
            { v: 'Cyber e dados', l: 'Cyber e dados' },
            { v: 'Ainda não sei', l: 'Ainda não sei' }
          ]
        }
      ]
    },
    {
      id: 'emp-perfil',
      stage: 'perfil',
      title: 'Última pergunta',
      fields: [
        {
          name: 'empresa_possui_seguro', type: 'cards', required: false, autoAdvance: true, size: 'sm',
          label: 'A empresa já possui algum seguro?',
          options: [
            { v: 'Sim', l: 'Sim' },
            { v: 'Não', l: 'Não' },
            { v: 'Vencendo em breve', l: 'Vencendo em breve' }
          ]
        }
      ]
    }
  ],

  saude: [
    {
      id: 'saude-para-quem',
      stage: 'detalhes',
      title: 'Para quem é o plano?',
      fields: [
        {
          name: 'para_quem', type: 'cards', required: true, autoAdvance: true,
          options: [
            { v: 'Para mim', l: 'Para mim', d: 'Plano individual.' },
            { v: 'Para minha família', l: 'Para minha família', d: 'Você e seus dependentes.' },
            { v: 'Para minha empresa', l: 'Para minha empresa', d: 'Plano coletivo para a equipe.' }
          ]
        }
      ]
    },
    {
      id: 'saude-quantidade',
      stage: 'detalhes',
      title: 'Quantas pessoas estarão incluídas?',
      fields: [
        {
          name: 'numero_pessoas', type: 'cards', required: true, autoAdvance: true, size: 'sm',
          options: [
            { v: '1 pessoa', l: '1 pessoa' },
            { v: '2 pessoas', l: '2 pessoas' },
            { v: '3 a 5 pessoas', l: '3 a 5 pessoas' },
            { v: 'Mais de 5 pessoas', l: 'Mais de 5' }
          ]
        }
      ]
    },
    {
      id: 'saude-perfil',
      stage: 'perfil',
      title: 'Sobre o titular',
      fields: [
        { name: 'faixa_etaria', type: 'select', label: 'Faixa etária do titular', required: true, placeholder: 'Selecione', options: FAIXAS_ETARIAS },
        { name: 'cidade_plano', type: 'text', label: 'Cidade onde será usado', required: true, placeholder: 'Ex.: Ipatinga', list: CIDADES_MG, listId: 'lista-cidades' }
      ]
    }
  ],

  viagem: [
    {
      id: 'viagem-destino',
      stage: 'detalhes',
      title: 'Para onde você vai viajar?',
      fields: [
        { name: 'destino', type: 'text', label: 'Destino', required: true, placeholder: 'Ex.: São Paulo, Europa, Estados Unidos' },
        { name: 'data_partida', type: 'date', label: 'Data de partida', required: true }
      ]
    },
    {
      id: 'viagem-duracao',
      stage: 'detalhes',
      title: 'Quanto tempo dura a viagem?',
      fields: [
        {
          name: 'duracao_viagem', type: 'cards', required: true, autoAdvance: true, size: 'sm',
          options: [
            { v: 'Até 7 dias', l: 'Até 7 dias' },
            { v: '8 a 15 dias', l: '8 a 15 dias' },
            { v: '16 a 30 dias', l: '16 a 30 dias' },
            { v: 'Mais de 30 dias', l: 'Mais de 30 dias' }
          ]
        },
        {
          name: 'viajantes', type: 'cards', required: true, autoAdvance: true, size: 'sm',
          label: 'Quantas pessoas viajam?',
          options: [
            { v: '1 viajante', l: '1' },
            { v: '2 viajantes', l: '2' },
            { v: '3 a 5 viajantes', l: '3 a 5' },
            { v: 'Mais de 5', l: 'Mais de 5' }
          ]
        }
      ]
    },
    {
      id: 'viagem-perfil',
      stage: 'perfil',
      title: 'Sobre a sua viagem',
      fields: [
        {
          name: 'tipo_viagem', type: 'cards', required: true, autoAdvance: true, size: 'sm',
          label: 'Qual o tipo de viagem?',
          options: [
            { v: 'Lazer', l: 'Lazer' },
            { v: 'Negócios', l: 'Negócios' },
            { v: 'Estudo', l: 'Estudo' }
          ]
        },
        {
          name: 'atividade_risco', type: 'cards', required: false, autoAdvance: true, size: 'sm',
          label: 'Vai praticar atividades de risco?',
          options: [
            { v: 'Sim', l: 'Sim' },
            { v: 'Não', l: 'Não' }
          ]
        }
      ]
    }
  ],

  consorcio: [
    {
      id: 'cons-objetivo',
      stage: 'detalhes',
      title: 'O que você quer conquistar?',
      fields: [
        {
          name: 'consorcio_objetivo', type: 'cards', required: true, autoAdvance: true,
          options: [
            { v: 'Automóvel', l: 'Automóvel', d: 'Carro, moto ou utilitário.' },
            { v: 'Imóvel', l: 'Imóvel', d: 'Apartamento ou casa.' },
            { v: 'Construção/reforma', l: 'Construção ou reforma', d: 'Obra, reforma ou terreno.' },
            { v: 'Outro bem', l: 'Outro', d: 'Conte o que deseja conquistar.' }
          ]
        }
      ]
    },
    {
      id: 'cons-outro',
      stage: 'detalhes',
      title: 'Qual bem você deseja?',
      fields: [
        { name: 'outro_bem', type: 'text', label: 'Bem desejado', required: true, placeholder: 'Ex.: Caminhão, barco, imóvel comercial' }
      ],
      when: (a) => a.consorcio_objetivo === 'Outro bem'
    },
    {
      id: 'cons-valor',
      stage: 'detalhes',
      title: 'Qual valor você está buscando?',
      fields: [
        {
          name: 'consorcio_valor', type: 'cards', required: true, autoAdvance: true, size: 'sm',
          options: [
            { v: 'Até R$ 100 mil', l: 'Até R$ 100 mil' },
            { v: 'R$ 100 mil a R$ 250 mil', l: 'R$ 100 mil a R$ 250 mil' },
            { v: 'R$ 250 mil a R$ 500 mil', l: 'R$ 250 mil a R$ 500 mil' },
            { v: 'R$ 500 mil a R$ 1 milhão', l: 'R$ 500 mil a R$ 1 milhão' },
            { v: 'Acima de R$ 1 milhão', l: 'Acima de R$ 1 milhão' }
          ]
        }
      ]
    },
    {
      id: 'cons-perfil',
      stage: 'perfil',
      title: 'Como você pretende ser contemplado?',
      fields: [
        {
          name: 'consorcio_prazo', type: 'cards', required: true, autoAdvance: true, size: 'sm',
          label: 'Quando pretende ser contemplado?',
          options: [
            { v: 'Até 12 meses', l: 'Até 12 meses' },
            { v: '12 a 24 meses', l: '12 a 24 meses' },
            { v: '24 a 36 meses', l: '24 a 36 meses' },
            { v: 'Não tenho pressa', l: 'Não tenho pressa' }
          ]
        },
        {
          name: 'consorcio_possui', type: 'cards', required: false, autoAdvance: true, size: 'sm',
          label: 'Você já possui algum consórcio?',
          options: [
            { v: 'Sim', l: 'Sim' },
            { v: 'Não', l: 'Não' }
          ]
        }
      ]
    }
  ],

  outro: [
    {
      id: 'outro-qual',
      stage: 'detalhes',
      title: 'Qual seguro você procura?',
      subtitle: 'Se não souber o nome exato, tudo bem — descreva do que precisa.',
      fields: [
        { name: 'produto_outro', type: 'text', label: 'Tipo de seguro', required: true, placeholder: 'Ex.: seguro para caminhão, motorcycle, bicicleta...' },
        { name: 'observacoes', type: 'textarea', label: 'Conte um pouco mais', required: false, placeholder: 'Opcional', rows: 3 }
      ]
    },
    {
      id: 'outro-perfil',
      stage: 'perfil',
      title: 'O que é mais importante para você?',
      fields: [
        { name: 'prioridade', type: 'cards', required: true, autoAdvance: true, size: 'sm', options: PRIORIDADE }
      ]
    }
  ]
};

/** Presets usados pelos CTAs do site (ex.: botão "Cotar agora" do Seguro Auto). */
export const PRESETS = {
  auto: { produto: 'auto' },
  residencial: { produto: 'residencial' },
  vida: { produto: 'vida' },
  empresarial: { produto: 'empresarial' },
  saude: { produto: 'saude' },
  viagem: { produto: 'viagem' },
  consorcio: { produto: 'consorcio' },
  outro: { produto: 'outro' },
  'consorcio-imovel': { produto: 'consorcio', consorcio_objetivo: 'Imóvel' },
  'consorcio-auto': { produto: 'consorcio', consorcio_objetivo: 'Automóvel' },
  'consorcio-obras': { produto: 'consorcio', consorcio_objetivo: 'Construção/reforma' }
};

export const ROTULOS_PRODUTO = ROTULO_PRODUTO;

/**
 * Monta a sequência completa de etapas para a sessão atual.
 * @param {object} answers respostas já dadas
 * @returns {Array} etapas na ordem de exibição
 */
export function construirFluxo(answers = {}) {
  const fluxo = FLUXOS[answers.produto] || [];
  const etapas = [stepProduto(), ...fluxo, stepContato(), stepRevisao()];
  return etapas.filter((e) => !e.when || e.when(answers));
}

export const STAGES = [
  { id: 'objetivo', label: 'Objetivo' },
  { id: 'detalhes', label: 'Detalhes' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'contato', label: 'Contato' },
  { id: 'finalizacao', label: 'Finalização' }
];

/** Mostra no resumo somente as respostas relevantes (na ordem das etapas). */
export function resumirRespostas(answers, etapas) {
  const itens = [];
  const vistos = new Set();

  if (answers.produto) {
    itens.push({ key: 'produto', label: 'Produto', valor: ROTULO_PRODUTO[answers.produto] || answers.produto });
    vistos.add('produto');
  }

  etapas.forEach((etapa) => {
    if (etapa.stage === 'contato' || etapa.review) return;
    (etapa.fields || []).forEach((campo) => {
      if (vistos.has(campo.name)) return;
      const valor = answers[campo.name];
      if (!valor) return;
      vistos.add(campo.name);
      itens.push({ key: campo.name, label: campo.label || rotuloCampo(campo.name), valor: formatarValor(campo, valor) });
    });
  });

  ['nome', 'whatsapp', 'email', 'cidade'].forEach((k) => {
    if (vistos.has(k) || !answers[k]) return;
    itens.push({ key: k, label: rotuloCampo(k), valor: answers[k] });
  });

  return itens;
}

function formatarValor(campo, valor) {
  if (Array.isArray(valor)) return valor.join(', ');
  const opcao = (campo.options || []).find((o) => o.v === valor);
  return opcao ? opcao.l : valor;
}

function rotuloCampo(name) {
  const mapa = {
    nome: 'Nome', whatsapp: 'WhatsApp', email: 'E-mail', cidade: 'Cidade',
    bairro: 'Bairro', veiculo: 'Veículo', ano_veiculo: 'Ano', uso_veiculo: 'Uso',
    tipo_imovel: 'Imóvel', situacao_imovel: 'Situação', para_quem: 'Para quem',
    faixa_etaria: 'Faixa etária', nome_empresa: 'Empresa', segmento: 'Segmento',
    funcionarios: 'Funcionários', destino: 'Destino', data_partida: 'Partida',
    produto_outro: 'Tipo de seguro', observacoes: 'Observações'
  };
  return mapa[name] || name;
}

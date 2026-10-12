/**
 * Configuração central do site da Ultra Seguros e Consórcios.
 * Altere apenas este arquivo para atualizar telefone, WhatsApp, endereço etc.
 */

export const SITE = {
  nome: 'Ultra Seguros e Consórcios',
  nomeCurto: 'Ultra',
  cidade: 'Ipatinga/MG',

  telefone: '(31) 3092-4945',
  telefoneLink: 'tel:+553130924945',

  /**
   * Número usado nos botões de WhatsApp (formato: 55 + DDD + número).
   * ATENÇÃO: foi utilizado o telefone oficial da empresa.
   * Se o WhatsApp oficial for outro número, basta alterar aqui.
   */
  whatsapp: '553130924945',
  whatsappTexto: 'Olá! Vim pelo site da Ultra Seguros e Consórcios e gostaria de falar com um consultor.',

  instagram: '', // ex.: 'https://www.instagram.com/ultraseguros' (vazio = link oculto)
  email: '',     // ex.: 'contato@ultraseguros.com.br' (vazio = link oculto)

  endereco: {
    linha1: 'Av. Monteiro Lobato, 158 - Sala 106',
    linha2: 'Cidade Nobre - Ipatinga/MG',
    // Consulta pública no Google Maps (não requer chave de API)
    mapa: 'https://www.google.com/maps?q=Av.%20Monteiro%20Lobato%2C%20158%20-%20Cidade%20Nobre%2C%20Ipatinga%20-%20MG&output=embed',
    mapaLink: 'https://www.google.com/maps/search/?api=1&query=Av.%20Monteiro%20Lobato%2C%20158%20-%20Cidade%20Nobre%2C%20Ipatinga%20-%20MG'
  },

  /** Avaliações reais (somente informar o que for verificável). */
  google: {
    avaliacoes: 40,
    nota: null, // ex.: 4.9 — preencher somente com a nota real do Google
    link: 'https://www.google.com/search?q=Ultra+Seguros+e+Cons%C3%B3rcios+Ipatinga+MG'
  },

  /**
   * Endpoint da API interna que recebe a cotação e encaminha ao sistema atual.
   * Em produção, mantenha como está (/api/cotacao) — o backend faz a integração.
   */
  apiCotacao: '/api/cotacao'
};

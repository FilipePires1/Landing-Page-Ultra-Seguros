/**
 * MOTOR DO FORMULÁRIO MULTI-ETAPAS.
 *
 * Renderiza uma pergunta por vez, controla progresso, validação,
 * máscaras, resumo e envio — tudo dentro do site da Ultra.
 */
import { construirFluxo, STAGES, resumirRespostas, ROTULOS_PRODUTO, PRESETS } from './steps.js';
import { enviarCotacao, mensagemWhatsApp } from '../integration.js';
import { SITE } from '../config.js';

const SESSAO_KEY = 'ultra_quote_answers';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const temValor = (v) => Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && String(v).trim() !== '';

function mascaraTelefone(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function salvar(answers) {
  try { sessionStorage.setItem(SESSAO_KEY, JSON.stringify(answers)); } catch { /* ignora */ }
}

function restaurar() {
  try { return JSON.parse(sessionStorage.getItem(SESSAO_KEY) || '{}'); } catch { return {}; }
}

function etapaCompleta(etapa, answers) {
  return (etapa.fields || []).every((f) => (f.when ? f.when(answers) : true) && (!f.required || temValor(answers[f.name])));
}

/**
 * Cria um cotador dentro do elemento informado.
 * @param {HTMLElement} root
 * @param {{modo?: 'home'|'pagina'}} opcoes
 */
export function criarCotador(root, opcoes = {}) {
  const estado = {
    answers: { ...restaurar() },
    index: 0,
    etapas: [],
    enviando: false,
    modo: opcoes.modo || 'pagina'
  };

  /* ---------------------------------------------------------------- render */

  function indiceInicial() {
    let i = 0;
    while (i < estado.etapas.length - 1 && etapaCompleta(estado.etapas[i], estado.answers)) i++;
    return i;
  }

  function montar() {
    estado.etapas = construirFluxo(estado.answers);
    if (estado.index >= estado.etapas.length) estado.index = estado.etapas.length - 1;
    if (estado.index < 0) estado.index = 0;
  }

  function progressoHTML() {
    const stageAtual = estado.etapas[estado.index]?.stage || 'objetivo';
    const atualIdx = STAGES.findIndex((s) => s.id === stageAtual);

    const itens = STAGES.map((s, i) => {
      const cls = i < atualIdx ? 'is-done' : i === atualIdx ? 'is-active' : '';
      return `<span class="q-progress__step ${cls}" role="listitem">
        <span class="q-progress__dot">${i < atualIdx ? '✓' : i + 1}</span>
        <span class="q-progress__label">${esc(s.label)}</span>
      </span>`;
    }).join('');

    return `<div class="q-progress" role="list" aria-label="Progresso da cotação">
        <div class="q-progress__title">Sua cotação</div>
        <div class="q-progress__steps">${itens}</div>
        <div class="q-progress__bar-mobile"><span style="width:${Math.round(((atualIdx + 1) / STAGES.length) * 100)}%"></span></div>
      </div>`;
  }

  function campoHTML(campo) {
    if (campo.when && !campo.when(estado.answers)) return '';

    const id = `f-${campo.name}`;
    const valor = estado.answers[campo.name];
    const label = campo.label
      ? `<label class="q-label" for="${id}">${esc(campo.label)}${campo.required ? ' <i>*</i>' : ''}</label>`
      : '';
    const hint = campo.hint ? `<p class="q-hint">${esc(campo.hint)}</p>` : '';
    const erro = `<p class="q-error" data-erro="${campo.name}"></p>`;

    let controle = '';

    switch (campo.type) {
      case 'cards': {
        const opcoes = campo.options.map((o) => {
          const ativo = Array.isArray(valor) ? valor.includes(o.v) : valor === o.v;
          return `<button type="button" class="q-card ${ativo ? 'is-selected' : ''}" data-card="${campo.name}" data-value="${esc(o.v)}" aria-pressed="${ativo}">
              ${o.e ? `<span class="q-card__emoji">${o.e}</span>` : ''}
              <span class="q-card__body">
                <span class="q-card__title">${esc(o.l)}</span>
                ${o.d ? `<span class="q-card__desc">${esc(o.d)}</span>` : ''}
              </span>
              <span class="q-card__check" aria-hidden="true">✓</span>
            </button>`;
        }).join('');
        controle = `<div class="q-cards ${campo.size === 'sm' ? 'q-cards--sm' : ''}" data-group="${campo.name}">${opcoes}</div>`;
        break;
      }

      case 'multi': {
        const selecionados = Array.isArray(valor) ? valor : [];
        const opcoes = campo.options.map((o) => {
          const ativo = selecionados.includes(o.v);
          return `<button type="button" class="q-card q-card--sm ${ativo ? 'is-selected' : ''}" data-multi="${campo.name}" data-value="${esc(o.v)}" aria-pressed="${ativo}">
              ${o.e ? `<span class="q-card__emoji">${o.e}</span>` : ''}
              <span class="q-card__body"><span class="q-card__title">${esc(o.l)}</span></span>
              <span class="q-card__check" aria-hidden="true">✓</span>
            </button>`;
        }).join('');
        controle = `<div class="q-cards q-cards--sm" data-group="${campo.name}">${opcoes}</div>`;
        break;
      }

      case 'select': {
        const opcoes = (campo.options || [])
          .map((o) => `<option value="${esc(o.v)}" ${valor === o.v ? 'selected' : ''}>${esc(o.l)}</option>`).join('');
        controle = `<select class="q-input q-input--select" id="${id}" data-campo="${campo.name}" ${campo.required ? 'required' : ''}>
            <option value="">${esc(campo.placeholder || 'Selecione')}</option>${opcoes}
          </select>`;
        break;
      }

      case 'textarea':
        controle = `<textarea class="q-input q-input--area" id="${id}" data-campo="${campo.name}" rows="${campo.rows || 3}"
            placeholder="${esc(campo.placeholder || '')}" ${campo.required ? 'required' : ''}>${esc(valor || '')}</textarea>`;
        break;

      case 'tel':
        controle = `<input class="q-input" id="${id}" data-campo="${campo.name}" data-mascara="tel" type="tel" inputmode="tel"
            autocomplete="${esc(campo.autocomplete || 'tel')}" placeholder="${esc(campo.placeholder || '')}" value="${esc(valor || '')}">`;
        break;

      case 'email':
        controle = `<input class="q-input" id="${id}" data-campo="${campo.name}" type="email" inputmode="email"
            autocomplete="${esc(campo.autocomplete || 'email')}" placeholder="${esc(campo.placeholder || '')}" value="${esc(valor || '')}">`;
        break;

      case 'date':
        controle = `<input class="q-input" id="${id}" data-campo="${campo.name}" type="date" value="${esc(valor || '')}">`;
        break;

      default:
        controle = `<input class="q-input" id="${id}" data-campo="${campo.name}" type="text"
            autocomplete="${esc(campo.autocomplete || 'off')}" placeholder="${esc(campo.placeholder || '')}"
            value="${esc(valor || '')}" ${campo.list ? `list="${esc(campo.listId || campo.list)}"` : ''}>`;
    }

    const datalist = campo.list && campo.type !== 'select'
      ? `<datalist id="${esc(campo.listId || campo.list)}">${campo.optionsHTML || campo.list.map((o) => `<option value="${esc(String(o).trim())}"></option>`).join('')}</datalist>`
      : '';

    return `<div class="q-field" data-field="${campo.name}">${label}${controle}${hint}${erro}${datalist}</div>`;
  }

  function revisaoHTML() {
    const itens = resumirRespostas(estado.answers, estado.etapas);
    const linhas = itens.map((i) => `
      <div class="q-review__row">
        <span class="q-review__label">${esc(i.label)}</span>
        <span class="q-review__value">${esc(i.valor)}</span>
      </div>`).join('');

    return `<div class="q-review">
        <div class="q-review__grid">${linhas}</div>
        <div class="q-review__actions">
          <button type="button" class="btn btn--soft" data-acao="editar">Editar informações</button>
          <button type="button" class="btn btn--primary btn--lg" data-acao="enviar">Enviar minha solicitação</button>
        </div>
        ${linkAjuda()}
        <p class="q-review__lgpd">Ao enviar, você concorda em ser contatado pela equipe da Ultra sobre esta solicitação.</p>
      </div>`;
  }

  function render() {
    montar();
    const etapa = estado.etapas[estado.index];

    const acoes = etapa.review ? '' : `
      <div class="q-nav">
        <div class="q-nav__row">
          ${estado.index > 0 ? '<button type="button" class="q-nav__back" data-acao="voltar">← Voltar</button>' : '<span></span>'}
          <button type="button" class="btn btn--primary btn--lg" data-acao="continuar">Continuar <span aria-hidden="true">→</span></button>
        </div>
        ${linkAjuda()}
      </div>`;

    root.innerHTML = `
      <div class="q" data-etapa="${etapa.id}">
        ${progressoHTML()}
        <div class="q-stage" data-step="${etapa.id}">
          <h3 class="q-title">${esc(etapa.title)}</h3>
          ${etapa.subtitle ? `<p class="q-subtitle">${esc(etapa.subtitle)}</p>` : ''}
          <div class="q-fields">${etapa.review ? revisaoHTML() : (etapa.fields || []).map(campoHTML).join('')}</div>
          ${acoes}
        </div>
      </div>`;

    bind();
    salvar(estado.answers);
  }

  /* ------------------------------------------------------------ interações */

  function bind() {
    root.querySelectorAll('[data-acao]').forEach((el) => {
      el.addEventListener('click', () => {
        const acao = el.dataset.acao;
        if (acao === 'continuar') avancar();
        if (acao === 'voltar') voltar();
        if (acao === 'editar') { estado.index = 0; render(); }
        if (acao === 'revisar') { estado.index = estado.etapas.length - 1; render(); }
        if (acao === 'enviar') enviar();
        if (acao === 'tentar') enviar();
        if (acao === 'refazer') reiniciar();
      });
    });

    root.querySelectorAll('[data-campo]').forEach((el) => {
      const name = el.dataset.campo;
      if (el.dataset.mascara === 'tel') {
        el.addEventListener('input', () => {
          el.value = mascaraTelefone(el.value);
          estado.answers[name] = el.value;
          salvar(estado.answers);
        });
      } else {
        el.addEventListener('input', () => {
          estado.answers[name] = el.value;
          salvar(estado.answers);
          limparErro(name);
        });
        el.addEventListener('change', () => {
          estado.answers[name] = el.value;
          salvar(estado.answers);
          limparErro(name);
        });
      }
      el.addEventListener('blur', () => validarCampo(name));
    });

    root.querySelectorAll('[data-card]').forEach((el) => {
      el.addEventListener('click', () => {
        const name = el.dataset.card;
        estado.answers[name] = el.dataset.value;
        salvar(estado.answers);
        limparErro(name);

        root.querySelectorAll(`[data-card="${name}"]`).forEach((b) => {
          const ativo = b === el;
          b.classList.toggle('is-selected', ativo);
          b.setAttribute('aria-pressed', String(ativo));
        });

        const etapa = estado.etapas[estado.index];
        const campo = (etapa.fields || []).find((f) => f.name === name);
        if (campo?.autoAdvance && etapaCompleta(etapa, estado.answers)) {
          setTimeout(avancar, 340);
        }
      });
    });

    root.querySelectorAll('[data-multi]').forEach((el) => {
      el.addEventListener('click', () => {
        const name = el.dataset.multi;
        const atual = Array.isArray(estado.answers[name]) ? [...estado.answers[name]] : [];
        const v = el.dataset.value;
        const i = atual.indexOf(v);
        if (i >= 0) atual.splice(i, 1); else atual.push(v);
        estado.answers[name] = atual;
        salvar(estado.answers);
        limparErro(name);
        const ativo = atual.includes(v);
        el.classList.toggle('is-selected', ativo);
        el.setAttribute('aria-pressed', String(ativo));
      });
    });
  }

  function limparErro(name) {
    const campo = root.querySelector(`[data-field="${name}"]`);
    if (campo) campo.classList.remove('has-error');
    const erro = root.querySelector(`[data-erro="${name}"]`);
    if (erro) erro.textContent = '';
  }

  function definirErro(name, mensagem) {
    const campo = root.querySelector(`[data-field="${name}"]`);
    if (campo) campo.classList.add('has-error');
    const erro = root.querySelector(`[data-erro="${name}"]`);
    if (erro) erro.textContent = mensagem;
  }

  function validarCampo(name) {
    const etapa = estado.etapas[estado.index];
    const campo = (etapa.fields || []).find((f) => f.name === name);
    if (!campo || (campo.when && !campo.when(estado.answers))) return true;

    const valor = estado.answers[name];
    limparErro(name);

    if (campo.required && !temValor(valor)) {
      definirErro(name, 'Este campo é obrigatório.');
      return false;
    }
    if (!temValor(valor)) return true;

    if (campo.type === 'email' && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(valor)) {
      definirErro(name, 'Informe um e-mail válido.');
      return false;
    }
    if (campo.type === 'tel' && String(valor).replace(/\D/g, '').length < 10) {
      definirErro(name, 'Informe um WhatsApp válido com DDD.');
      return false;
    }
    return true;
  }

  function validarEtapa() {
    const etapa = estado.etapas[estado.index];
    let ok = true;
    let primeiroInvalido = null;

    (etapa.fields || []).forEach((campo) => {
      if (campo.when && !campo.when(estado.answers)) return;
      if (!validarCampo(campo.name)) {
        ok = false;
        if (!primeiroInvalido) primeiroInvalido = campo.name;
      }
    });

    if (!ok && primeiroInvalido) {
      const alvo = root.querySelector(`[data-field="${primeiroInvalido}"]`);
      alvo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      alvo?.querySelector('input, select, textarea, button')?.focus({ preventScroll: true });
    }
    return ok;
  }

  function avancar() {
    if (estado.enviando) return;
    if (!validarEtapa()) return;
    if (estado.index < estado.etapas.length - 1) {
      estado.index++;
      render();
      rolarParaTopo();
    }
  }

  function voltar() {
    if (estado.index > 0) {
      estado.index--;
      render();
      rolarParaTopo();
    }
  }

  function rolarParaTopo() {
    const y = root.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  /* ------------------------------------------------------------------ envio */

  async function enviar() {
    if (estado.enviando) return;
    estado.enviando = true;

    const botao = root.querySelector('[data-acao="enviar"]');
    if (botao) {
      botao.disabled = true;
      botao.classList.add('is-loading');
      botao.textContent = 'Enviando...';
    }

    const resultado = await enviarCotacao(estado.answers, { fluxo: 'cotacao_site' });
    estado.enviando = false;

    if (resultado.ok) {
      window.dispatchEvent(new CustomEvent('ultra:quote:enviado', { detail: { produto: estado.answers.produto } }));
      renderSucesso();
    } else {
      renderFalha();
    }
  }

  function mensagemWa(extra = '') {
    const produto = ROTULOS_PRODUTO[estado.answers.produto] || 'cotação';
    return `Olá! Acabei de solicitar uma cotação de ${produto.toLowerCase()} no site da Ultra.${extra ? ' ' + extra : ''}`;
  }

  function urlWhats(msg) {
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`;
  }

  /** WhatsApp convivendo com o formulário: presente em todas as etapas. */
  function linkAjuda() {
    return `<a class="q-ajuda" href="${urlWhats(SITE.whatsappTexto)}" target="_blank" rel="noopener">Prefere falar diretamente? <b>Fale no WhatsApp →</b></a>`;
  }

  function renderSucesso() {
    try { sessionStorage.removeItem(SESSAO_KEY); } catch { /* ignora */ }
    root.innerHTML = `
      <div class="q q--sucesso">
        <div class="q-success">
          <div class="q-success__icon" aria-hidden="true">✓</div>
          <h3 class="q-success__title">Solicitação enviada!</h3>
          <p class="q-success__text">Recebemos seus dados. Agora nossa equipe irá analisar sua solicitação e entrar em contato com você.</p>
          <div class="q-success__actions">
            <a class="btn btn--whatsapp btn--lg" href="${urlWhats(mensagemWa())}" target="_blank" rel="noopener">Falar com a Ultra pelo WhatsApp</a>
            <a class="btn btn--soft btn--lg" href="/">Voltar para o site</a>
          </div>
          <button type="button" class="q-success__again" data-acao="refazer">Fazer outra cotação</button>
        </div>
      </div>`;
    bind();
    rolarParaTopo();
  }

  function renderFalha() {
    const resumo = mensagemWhatsApp(estado.answers);
    root.innerHTML = `
      <div class="q q--falha">
        <div class="q-success q-success--erro">
          <div class="q-success__icon q-success__icon--erro" aria-hidden="true">!</div>
          <h3 class="q-success__title">Não conseguimos enviar agora</h3>
          <p class="q-success__text">Seus dados foram preservados. Fale com a nossa equipe no WhatsApp que concluímos a cotação por lá — ou tente novamente em instantes.</p>
          <div class="q-success__actions">
            <a class="btn btn--whatsapp btn--lg" href="${urlWhats(resumo)}" target="_blank" rel="noopener">Concluir no WhatsApp</a>
            <button type="button" class="btn btn--primary btn--lg" data-acao="tentar">Tentar novamente</button>
          </div>
          <button type="button" class="q-success__again" data-acao="revisar">Voltar e revisar dados</button>
        </div>
      </div>`;
    bind();
    rolarParaTopo();
  }

  function reiniciar() {
    estado.answers = {};
    estado.index = 0;
    try { sessionStorage.removeItem(SESSAO_KEY); } catch { /* ignora */ }
    render();
    rolarParaTopo();
  }

  /* --------------------------------------------------------------- pública */

  /**
   * Aplica um preset vindo dos CTAs do site.
   * Ex.: Cotar "Seguro Auto" já com o produto escolhido.
   */
  function aplicarPreset(preset, { rolar = true } = {}) {
    const dados = typeof preset === 'string' ? (PRESETS[preset] || { produto: preset }) : preset;
    if (!dados) return;

    estado.answers = { ...estado.answers, ...restaurar(), ...dados };
    montar();
    estado.index = indiceInicial();
    render();
    if (rolar) rolarParaTopo();
  }

  function irParaIndice(i) {
    estado.index = i;
    render();
    rolarParaTopo();
  }

  montar();
  estado.index = indiceInicial();
  render();

  const api = { aplicarPreset, reiniciar, irParaIndice, get answers() { return estado.answers; } };
  window.__ultraQuoter = api;
  return api;
}

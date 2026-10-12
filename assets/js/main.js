/**
 * Comportamento geral do site: menu, animações de entrada,
 * CTAs conectados ao formulário interno e montagem do cotador.
 */
import { SITE } from './config.js';
import { criarCotador } from './form/engine.js';
import { reenviarPendentes } from './integration.js';

/* ---------------------------------------------------------- dados dinâmicos */

function preencherDados() {
  document.querySelectorAll('[data-site="telefone"]').forEach((el) => { el.textContent = SITE.telefone; });
  document.querySelectorAll('[data-site="telefone-link"]').forEach((el) => { el.href = SITE.telefoneLink; });
  document.querySelectorAll('[data-site="endereco"]').forEach((el) => {
    el.innerHTML = `${SITE.endereco.linha1}<br>${SITE.endereco.linha2}`;
  });
  document.querySelectorAll('[data-site="mapa"]').forEach((el) => { el.src = SITE.endereco.mapa; });
  document.querySelectorAll('[data-site="mapa-link"]').forEach((el) => { el.href = SITE.endereco.mapaLink; });

  document.querySelectorAll('[data-site="avaliacoes"]').forEach((el) => {
    el.textContent = `${SITE.google.avaliacoes} avaliações no Google`;
  });

  const wa = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(SITE.whatsappTexto)}`;
  document.querySelectorAll('[data-site="whatsapp"]').forEach((el) => { el.href = wa; });

  document.querySelectorAll('[data-site="instagram"]').forEach((el) => {
    if (!SITE.instagram) { el.remove(); return; }
    el.href = SITE.instagram;
  });
  document.querySelectorAll('[data-site="instagram-texto"]').forEach((el) => {
    if (!SITE.instagram) { el.textContent = ''; return; }
    try {
      const trecho = new URL(SITE.instagram).pathname.replace(/\//g, '').trim();
      el.textContent = trecho ? `@${trecho}` : SITE.instagram;
    } catch {
      el.textContent = SITE.instagram;
    }
  });
  document.querySelectorAll('[data-site="email"]').forEach((el) => {
    if (!SITE.email) { el.remove(); return; }
    el.href = `mailto:${SITE.email}`;
    el.textContent = SITE.email;
  });

  document.querySelectorAll('[data-site="ano"]').forEach((el) => { el.textContent = new Date().getFullYear(); });
}

/* ------------------------------------------------------------------- menu */

function menu() {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-menu]');

  const aoRolar = () => header?.classList.toggle('is-scrolled', window.scrollY > 12);
  aoRolar();
  window.addEventListener('scroll', aoRolar, { passive: true });

  toggle?.addEventListener('click', () => {
    const aberto = header.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(aberto));
    document.body.classList.toggle('menu-aberto', aberto);
  });

  nav?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
    header?.classList.remove('is-open');
    document.body.classList.remove('menu-aberto');
    toggle?.setAttribute('aria-expanded', 'false');
  }));
}

/* ------------------------------------------------------- animação de entrada */

function revelar() {
  const alvos = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    alvos.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  alvos.forEach((el) => obs.observe(el));
}

/* ------------------------------------------------------- âncoras suaves */

function ancoras() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const alvo = document.querySelector(id);
      if (!alvo) return;
      e.preventDefault();
      const y = alvo.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: 'smooth' });
      history.replaceState(null, '', id);
    });
  });
}

/* --------------------------------------------- cotador + CTAs internos */

function montarCotador() {
  const alvo = document.querySelector('[data-quoter]');
  if (!alvo) return null;
  return criarCotador(alvo, { modo: alvo.dataset.modo || 'pagina' });
}

function conectarCTAs(quoter) {
  document.querySelectorAll('[data-cta]').forEach((el) => {
    el.addEventListener('click', (e) => {
      const preset = el.dataset.cta;
      const secao = document.querySelector('#cotacao');

      if (quoter && secao) {
        e.preventDefault();
        quoter.aplicarPreset(preset);
        const y = secao.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top: y, behavior: 'smooth' });
        return;
      }

      if (quoter) {
        e.preventDefault();
        quoter.aplicarPreset(preset);
        return;
      }

      // Sem formulário nesta página: leva para a rota interna /cotacao
      e.preventDefault();
      window.location.href = `/cotacao?produto=${encodeURIComponent(preset)}`;
    });
  });
}

/* --------------------------- WhatsApp flutuante x formulário */

function combinarWhatsappFormulario() {
  const shell = document.querySelector('.cotacao-shell');
  const flutuantes = document.querySelectorAll('.wa-flutuante, .wa-nota');
  if (!shell || !flutuantes.length || !('IntersectionObserver' in window)) return;

  const obs = new IntersectionObserver(
    (entradas) => {
      const visivel = entradas.some((e) => e.isIntersecting);
      flutuantes.forEach((el) => el.classList.toggle('is-oculto', visivel));
    },
    { threshold: 0 }
  );
  obs.observe(shell);
}

/* ------------------------------------------------------------------ início */

function iniciar() {
  preencherDados();
  menu();
  revelar();
  ancoras();
  combinarWhatsappFormulario();

  const quoter = montarCotador();
  conectarCTAs(quoter);

  if (quoter) {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get('produto') || params.get('cotacao');
    if (preset) quoter.aplicarPreset(preset, { rolar: false });
  }

  reenviarPendentes();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciar);
} else {
  iniciar();
}

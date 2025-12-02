/* ===========================
   Utils
=========================== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const norm = (txt) => (txt || "").toString().toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove acentos

/* ===========================
   Toast (push) de confirmação
   - cria automaticamente o container caso não exista
   - fallback: alert()
=========================== */
function ensureToastContainer() {
  let stack = document.getElementById('toastContainer');
  if (!stack) {
    stack = document.createElement('div');
    stack.id = 'toastContainer';
    stack.setAttribute('aria-live', 'polite');
    stack.setAttribute('aria-atomic', 'true');
    // estilo mínimo inline para não depender de CSS externo
    stack.style.position = 'fixed';
    stack.style.right = '16px';
    stack.style.bottom = '16px';
    stack.style.display = 'grid';
    stack.style.gap = '8px';
    stack.style.zIndex = '2000';
    document.body.appendChild(stack);
  }
  return stack;
}

function pushToast(message = 'Item adicionado ao carrinho') {
  const stack = ensureToastContainer();
  if (!stack) { alert(message); return; }

  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.gap = '10px';
  el.style.padding = '10px 12px';
  el.style.borderRadius = '12px';
  el.style.background = '#0f172a';
  el.style.color = '#fff';
  el.style.boxShadow = '0 10px 20px rgba(0,0,0,.2)';
  el.style.fontWeight = '600';
  el.style.transition = 'transform .16s ease, opacity .16s ease';
  el.style.transform = 'translateY(8px)';
  el.style.opacity = '0.95';

  el.innerHTML = `
    <span style="display:inline-grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#10b981;font-weight:800">✓</span>
    <span>${message}</span>
    <button aria-label="Fechar notificação" style="margin-left:auto;background:transparent;border:0;color:#fff;font-size:20px;line-height:1;cursor:pointer">×</button>
  `;

  const remove = () => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    setTimeout(() => el.remove(), 180);
  };

  el.querySelector('button')?.addEventListener('click', remove);

  stack.appendChild(el);
  // entrada
  requestAnimationFrame(() => { el.style.transform = 'translateY(0)'; el.style.opacity = '1'; });
  // saída automática
  setTimeout(remove, 2600);
}

/* ===========================
   Ready
=========================== */
document.addEventListener('DOMContentLoaded', () => {
  /* Ano no rodapé */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Scroll suave para âncoras */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href && href.length > 1) {
        e.preventDefault();
        $(href)?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* CTA WhatsApp nos cards */
  const baseZap = 'https://wa.me/5581992225420?text=';
  $$('[data-cta="whats"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.card');
      const title = card?.querySelector('h4')?.textContent?.trim() || 'Produto Luna';
      const msg = encodeURIComponent(`Olá, vim do site e me interessei por: ${title}. Poderiam enviar mais detalhes?`);
      const w = window.open(baseZap + msg, '_blank');
      if (w && w.opener) w.opener = null;
    });
  });

  /* ===========================
     Carrossel do Hero
  =========================== */
  (function initHeroCarousel() {
    const root = $('#heroCarousel'); if (!root) return;
    const slides = $$('.car-slide', root);
    const prev = $('.car-btn.prev', root);
    const next = $('.car-btn.next', root);
    const dotsEl = $('.car-dots', root);

    if (!slides.length) return;
    if (slides.length === 1) { slides[0].classList.add('is-active'); return; }

    let idx = 0, timer = null;
    const AUTOPLAY_MS = 4500;

    // dots
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.className = 'car-dot' + (i === 0 ? ' is-active' : '');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', `Ir para imagem ${i + 1}`);
      b.addEventListener('click', () => goTo(i, true));
      dotsEl?.appendChild(b);
    });
    const dots = $$('.car-dot', root);

    function show(i) {
      slides.forEach(s => s.classList.remove('is-active'));
      dots.forEach(d => d.classList.remove('is-active'));
      slides[i].classList.add('is-active');
      dots[i]?.classList.add('is-active');
    }
    function goTo(i, user = false) {
      idx = (i + slides.length) % slides.length;
      show(idx);
      if (user) restartAutoplay();
    }
    function nextSlide() { goTo(idx + 1); }
    function prevSlide() { goTo(idx - 1); }

    prev?.addEventListener('click', prevSlide);
    next?.addEventListener('click', nextSlide);

    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); nextSlide(); }
    });

    function startAutoplay() { stopAutoplay(); timer = setInterval(nextSlide, AUTOPLAY_MS); }
    function stopAutoplay() { if (timer) { clearInterval(timer); timer = null; } }
    function restartAutoplay() { stopAutoplay(); startAutoplay(); }

    root.addEventListener('mouseenter', stopAutoplay);
    root.addEventListener('mouseleave', startAutoplay);
    document.addEventListener('visibilitychange', () => document.hidden ? stopAutoplay() : startAutoplay());

    show(idx); startAutoplay();
  })();

  /* ===========================
     Busca global no header
     - atalho "/"
     - integra com filtros (input)
     - ao SUBMIT: rola e destaca o primeiro produto encontrado
  =========================== */
  window.__searchTerm = "";
  (function initHeaderSearch() {
    const form = $('#siteSearch');
    const input = $('#searchInput');
    const btn = form?.querySelector('.search-btn');
    if (!form || !input) return;

    // Atalho "/"
    window.addEventListener('keydown', (e) => {
      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (!typing && e.key === '/') { e.preventDefault(); input.focus(); }
    });

    // Emissão do evento de busca (para filtros reagirem)
    let t = null;
    function emit() {
      window.__searchTerm = norm(input.value || "");
      document.dispatchEvent(new CustomEvent('search:changed', { detail: { term: window.__searchTerm } }));
    }

    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(emit, 180); });
    btn?.addEventListener('click', emit);

    // SUBMIT: rola e destaca o primeiro card correspondente
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = norm(input.value || "");
      if (!q) return;

      // remove destaques anteriores
      $$('.card.is-highlight').forEach(c => c.classList.remove('is-highlight'));

      // procura o primeiro card que bata
      const cards = $$('.card');
      let match = null;
      for (const card of cards) {
        const title = norm(card.querySelector('h4')?.textContent);
        const badge = norm(card.querySelector('.badge-mini')?.textContent);
        const extra = norm(card.querySelector('.card__body p')?.textContent);
        const line = norm(card.getAttribute('data-line'));
        const spec = norm(card.getAttribute('data-spec'));
        if (
          (title && title.includes(q)) ||
          (badge && badge.includes(q)) ||
          (extra && extra.includes(q)) ||
          (line && line.includes(q)) ||
          (spec && spec.includes(q))
        ) { match = card; break; }
      }

      if (match) {
        match.classList.add('is-highlight');
        match.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // tira o highlight depois de alguns segundos
        setTimeout(() => match.classList.remove('is-highlight'), 3500);
      } else {
        pushToast('Produto não encontrado. Tente outro termo.');
      }
    });
  })();

  /* ===========================
     Filtros (Portas & Janelas)
  =========================== */
  (function initAllFilters() {
    function initFilters(scopeName) {
      const scope = $(`.filters[data-scope="${scopeName}"]`);
      const grid = $(`.grid[data-grid="${scopeName}"]`);
      if (!scope || !grid) return;

      let currentLine = '*', currentSpec = '*';
      const lineBtns = $$('[data-filter-line]', scope);
      const specBtns = $$('[data-filter-spec]', scope);
      const countEl = $('[data-count]', scope);

      function setActive(btns, attr, value) {
        btns.forEach(b => b.classList.toggle('is-active', b.getAttribute(attr) === value));
      }

      function apply() {
        const cards = $$('.card', grid);
        let visible = 0;
        const term = window.__searchTerm || '';

        cards.forEach(card => {
          const line = (card.getAttribute('data-line') || '').trim();
          const spec = (card.getAttribute('data-spec') || '').trim();

          const title = norm(card.querySelector('h4')?.textContent || "");
          const badge = norm(card.querySelector('.badge-mini')?.textContent || "");
          const extra = norm(card.querySelector('.card__body p')?.textContent || "");
          const nLine = norm(line);
          const nSpec = norm(spec);

          const okLine = (currentLine === '*') || (line === currentLine);
          const okSpec = (currentSpec === '*') || (spec === currentSpec);
          const okTerm = !term || title.includes(term) || badge.includes(term) || extra.includes(term) || nLine.includes(term) || nSpec.includes(term);

          const show = okLine && okSpec && okTerm;
          card.style.display = show ? '' : 'none';
          if (show) visible++;
        });

        if (countEl) countEl.textContent = visible;
      }

      // init
      apply();

      lineBtns.forEach(b => b.addEventListener('click', () => {
        currentLine = b.getAttribute('data-filter-line');
        setActive(lineBtns, 'data-filter-line', currentLine);
        apply();
      }));
      specBtns.forEach(b => b.addEventListener('click', () => {
        currentSpec = b.getAttribute('data-filter-spec');
        setActive(specBtns, 'data-filter-spec', currentSpec);
        apply();
      }));

      document.addEventListener('search:changed', apply);
    }

    initFilters('portas');
    initFilters('janelas');
  })();

  /* ===========================
     Lightbox de imagem
     - cursor "busy" antes de abrir
  =========================== */
  (function initLightbox() {
    const lightbox = $('#lightbox');
    if (!lightbox) return;
    const imgEl = $('.lightbox-img', lightbox);
    const closeEl = $('.lightbox-close', lightbox);

    document.addEventListener('click', (e) => {
      const cardImg = e.target.closest('.card__img', 'card__img_1');
      if (!cardImg) return;

      // cursor busy enquanto carrega
      document.documentElement.style.cursor = 'progress';

      // pega URL
      let url = cardImg.getAttribute('data-full') || '';
      if (!url && cardImg.style?.backgroundImage) {
        const m = cardImg.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
        if (m && m[1]) url = m[1];
      }
      if (!url) { document.documentElement.style.cursor = ''; return; }

      // pré-carrega
      const tmp = new Image();
      tmp.onload = () => {
        imgEl.src = url;
        lightbox.classList.add('is-active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.documentElement.style.cursor = '';
      };
      tmp.onerror = () => { document.documentElement.style.cursor = ''; };
      tmp.src = url;
    });

    // fechar por clique no X ou fora
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target === closeEl) {
        lightbox.classList.remove('is-active');
        lightbox.setAttribute('aria-hidden', 'true');
        setTimeout(() => { imgEl.src = ''; }, 200);
      }
    });

    // fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-active')) {
        lightbox.classList.remove('is-active');
        lightbox.setAttribute('aria-hidden', 'true');
        setTimeout(() => { imgEl.src = ''; }, 200);
      }
    });
  })();

  /* ===========================
     Carrinho (drawer)
     - botões desktop/mobile
     - contadores sincronizados
     - NÃO abre sozinho ao adicionar
  =========================== */
  (function initCart() {
    window.addToCart = (item) => { add(item); };
    const CART_KEY = 'luna_cart_v1';
    const zapPhone = '5581992225420';

    const els = {
      toggles: [$('#cartToggle'), $('#cartToggleMobile')].filter(Boolean),
      close: $('#cartClose'),
      drawer: $('#cartDrawer'),
      backdrop: $('#cartBackdrop'),
      list: $('#cartList'),
      counts: [$('#cartCount'), $('#cartCountMobile')].filter(Boolean),
      checkout: $('#cartCheckout'),
    };

    const state = { items: load() }; // [{id,title,qty,price,img}]

    function load() { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; } }
    function save() { localStorage.setItem(CART_KEY, JSON.stringify(state.items)); }
    const money = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    function getCardData(card) {
      const title = card.querySelector('h4')?.textContent?.trim() || 'Produto Luna';
      const priceAttr = card.getAttribute('data-price-num');
      const priceSpan = card.querySelector('[data-price]');
      let price = 0;
      if (priceAttr) price = Number(priceAttr);
      else if (priceSpan && priceSpan.textContent && priceSpan.textContent !== 'Consultar') {
        const raw = priceSpan.textContent.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
        price = Number(raw || 0);
      }
      const thumb = card.querySelector('.card__img', 'card__img_1');
      let img = thumb?.getAttribute('data-full') || '';
      if (!img && thumb?.style?.backgroundImage) {
        img = thumb.style.backgroundImage.replace(/^url\(["']?/, '').replace(/["']?\)$/, '');
      }
      const id = card.getAttribute('data-sku') || title.toLowerCase().replace(/\s+/g, '-').slice(0, 60);
      return { id, title, price, img };
    }

    function open() {
      els.drawer?.classList.add('is-open');
      els.drawer?.setAttribute('aria-hidden', 'false');
      if (els.backdrop) {
        els.backdrop.hidden = false;
        els.backdrop.classList.add('show'); // animação
      }
    }
    function close() {
      els.drawer?.classList.remove('is-open');
      els.drawer?.setAttribute('aria-hidden', 'true');
      if (els.backdrop) {
        els.backdrop.classList.remove('show');
        els.backdrop.hidden = true;
      }
    }

    function add(item) {
      const found = state.items.find(x => x.id === item.id);
      found ? (found.qty += 1) : state.items.push({ ...item, qty: 1 });
      save(); render();
      // Somente notifica, NÃO abre o carrinho
      pushToast(`“${item.title}” adicionado ao carrinho`);
      // fallback: window.alert('Item adicionado ao carrinho');
    }
    function removeItem(id) {
      state.items = state.items.filter(x => x.id !== id);
      save(); render();
    }
    function setQty(id, q) {
      const it = state.items.find(x => x.id === id); if (!it) return;
      if (q <= 0) { removeItem(id); }
      else { it.qty = parseInt(q, 10) || 1; save(); render(); }
    }

    function render() {
      // contador (desktop + mobile)
      const totalQty = state.items.reduce((a, b) => a + b.qty, 0);
      els.counts.forEach(c => { if (c) c.textContent = totalQty; });

      // lista
      if (!els.list) return;
      els.list.innerHTML = '';
      if (!state.items.length) {
        els.list.innerHTML = '<p style="color:var(--muted)">Seu carrinho está vazio.</p>';
      } else {
        state.items.forEach(it => {
          const row = document.createElement('div');
          row.className = 'cart-item';
          row.innerHTML = `
            <div class="cart-item__img" style="background-image:url('${it.img || ''}')"></div>
            <div>
              <div class="cart-item__title">${it.title}</div>
              <div class="cart-item__meta">${it.price ? money(it.price) : 'Sob consulta'}</div>
              <div class="cart-item__qty" aria-label="Quantidade">
                <button type="button" data-dec="${it.id}" aria-label="Diminuir">-</button>
                <span data-qty="${it.id}">${it.qty}</span>
                <button type="button" data-inc="${it.id}" aria-label="Aumentar">+</button>
                <button type="button" class="cart-item__remove" data-del="${it.id}" aria-label="Remover">remover</button>
              </div>
            </div>
            <div style="font-weight:700">${it.price ? money(it.price * it.qty) : ''}</div>
          `;
          els.list.appendChild(row);
        });
      }
    }

    // DELEGAÇÃO: + / - / remover
    els.list?.addEventListener('click', (e) => {
      const dec = e.target.closest('[data-dec]');
      const inc = e.target.closest('[data-inc]');
      const del = e.target.closest('[data-del]');
      if (dec) {
        const id = dec.getAttribute('data-dec');
        const span = els.list.querySelector(`span[data-qty="${id}"]`) || dec.parentElement.querySelector('span');
        const curr = parseInt(span?.textContent || '1', 10) || 1;
        setQty(id, curr - 1);
      } else if (inc) {
        const id = inc.getAttribute('data-inc');
        const span = els.list.querySelector(`span[data-qty="${id}"]`) || inc.parentElement.querySelector('span');
        const curr = parseInt(span?.textContent || '1', 10) || 1;
        setQty(id, curr + 1);
      } else if (del) {
        const id = del.getAttribute('data-del');
        removeItem(id);
      }
    });

    function checkoutWhatsApp() {
      if (!state.items.length) { alert('Seu carrinho está vazio.'); return; }
      const lines = state.items.map(it => {
        const preco = it.price ? ` — ${money(it.price)} x ${it.qty}` : ` — ${it.qty} un. (consultar preço)`;
        return `• ${it.title}${preco}`;
      });
      const msg = [
        'Olá! Gostaria de finalizar este pedido:',
        ...lines, '', '', 'Vim do site da Luna Portas & Janelas.'
      ].join('\n');
      const url = `https://wa.me/${zapPhone}?text=${encodeURIComponent(msg)}`;
      const w = window.open(url, '_blank'); if (w && w.opener) w.opener = null;
    }
    // Botões globais (desktop + mobile)
    els.toggles.forEach(b => b.addEventListener('click', () => {
      const isOpen = els.drawer?.classList.contains('is-open');
      isOpen ? close() : open();
    }));
    els.close?.addEventListener('click', close);
    els.backdrop?.addEventListener('click', close);
    els.checkout?.addEventListener('click', checkoutWhatsApp);
    document.querySelector('.cart-close-fab')?.addEventListener('click', close);

    // Botões "Adicionar ao carrinho" dos cards
    $$('[data-add="cart"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.currentTarget.closest('.card'); if (!card) return;
        add(getCardData(card));
      });
    });

    // Render inicial
    render();
  })();
});

/* ===========================
   Fechar Carrinho no Mobile
   - Botão X específico para mobile
=========================== */
document.addEventListener('DOMContentLoaded', function () {
  // Fechar carrinho com botão X no mobile
  const cartClose = document.getElementById('cartClose');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartBackdrop');

  if (cartClose) {
    cartClose.addEventListener('click', function () {
      cartDrawer.classList.remove('is-open');
      cartBackdrop.classList.remove('show');
      document.body.style.overflow = ''; // Restaurar scroll se necessário
    });
  }

  // Fechar ao clicar no backdrop (redundante, mas seguro)
  if (cartBackdrop) {
    cartBackdrop.addEventListener('click', function () {
      cartDrawer.classList.remove('is-open');
      cartBackdrop.classList.remove('show');
      document.body.style.overflow = '';
    });
  }

  // Fechar com ESC key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && cartDrawer.classList.contains('is-open')) {
      cartDrawer.classList.remove('is-open');
      cartBackdrop.classList.remove('show');
      document.body.style.overflow = '';
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const texts = document.querySelectorAll('.promo-bar .promo-text');
  let current = 0;
  if (texts.length <= 1) return;

  function showNext() {
    texts[current].classList.remove('active');
    current = (current + 1) % texts.length;
    texts[current].classList.add('active');
  }

  setInterval(showNext, 4000);
});
/* ===== Quick View com carrossel de imagens - VERSÃO LUNA ===== */
(function ensureProductQuickView() {
  // CSS com as cores e estilo da Luna
  if (!document.getElementById('pmodalStyles')) {
    const css = `
  .pmodal {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: none;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }

  .pmodal.is-open {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .pmodal__backdrop {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.98));
    backdrop-filter: blur(6px);
    animation: pmodalFadeIn 0.3s ease-out;
  }

  .pmodal__dialog {
    position: relative;
    z-index: 1;
    width: 95%;
    max-width: 1200px;
    max-height: 90vh;
    background:
      radial-gradient(circle at top left, rgba(0, 52, 122, 0.05), transparent 55%),
      #ffffff;
    color: #0b1220;
    border-radius: 20px;
    box-shadow:
      0 34px 80px rgba(15, 23, 42, 0.55),
      0 0 0 1px rgba(148, 163, 184, 0.35);
    overflow: hidden;
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    animation: pmodalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: center center;
  }

  .pmodal__close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 0;
    background: rgba(255,255,255,0.95);
    color: #0f172a;
    font-size: 24px;
    font-weight: 400;
    line-height: 1;
    cursor: pointer;
    display: grid;
    place-items: center;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.35);
    transition: all 0.2s ease;
    z-index: 10;
    border: 1px solid rgba(148, 163, 184, 0.45);
    backdrop-filter: blur(8px);
  }

  .pmodal__close:hover {
    background: #f8fafc;
    transform: translateY(-1px) scale(1.03);
    border-color: #e2e8f0;
  }

  .pmodal__media {
    background: radial-gradient(circle at top, #020617, #020617 40%, #0b1120 100%);
    display: grid;
    grid-template-rows: 1fr auto;
    position: relative;
    overflow: hidden;
    border-right: 1px solid rgba(30, 64, 175, 0.35);
  }

  .pmodal__stage {
    position: relative;
    aspect-ratio: 1/1;
    overflow: hidden;
    background:
      radial-gradient(circle at top, rgba(15,23,42,0.9), rgba(15,23,42,1)),
      #020617;
    cursor: zoom-in;
  }

  .pmodal__stage.is-zoomed {
    cursor: grab;
    overflow: auto;
  }

  .pmodal__stage.is-zoomed:active {
    cursor: grabbing;
  }

  .pmodal__slide {
    position: absolute;
    inset: 0;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
    cursor: inherit;
  }

  .pmodal__slide.is-active {
    opacity: 1;
  }

  .pmodal__slide.is-zoomed {
    background-size: auto;
    cursor: inherit;
    min-width: 100%;
    min-height: 100%;
    transform-origin: 0 0;
  }

  .pmodal__nav {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    pointer-events: none;
    padding: 0 18px;
    z-index: 2;
  }

  .pmodal__nav button {
    pointer-events: auto;
    width: 46px;
    height: 46px;
    border-radius: 999px;
    border: 0;
    background: rgba(15, 23, 42, 0.86);
    color: #e5e7eb;
    font-size: 24px;
    font-weight: 300;
    cursor: pointer;
    display: grid;
    place-items: center;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
    border: 1px solid rgba(148, 163, 184, 0.45);
  }

  .pmodal__nav button:hover {
    background: rgba(15, 23, 42, 0.98);
    transform: translateY(-1px) scale(1.04);
    box-shadow: 0 16px 38px rgba(15, 23, 42, 0.7);
    border-color: rgba(191, 219, 254, 0.7);
  }

  .pmodal__zoom-btn {
    position: absolute;
    top: 16px;
    left: 16px;
    width: 40px;
    height: 40px;
    border-radius: 999px;
    border: 0;
    background: rgba(15,23,42,0.88);
    color: #e5e7eb;
    font-size: 18px;
    font-weight: 500;
    cursor: pointer;
    display: grid;
    place-items: center;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.7);
    transition: all 0.2s ease;
    backdrop-filter: blur(8px);
    z-index: 2;
    pointer-events: auto;
    border: 1px solid rgba(147, 197, 253, 0.7);
  }

  .pmodal__zoom-btn:hover {
    background: rgba(30,64,175, 0.98);
    transform: translateY(-1px) scale(1.04);
  }

  .pmodal__thumbs {
    display: flex;
    gap: 10px;
    padding: 16px 18px 18px;
    overflow-x: auto;
    background: linear-gradient(to bottom, #020617, #020617 30%, #020617);
    min-height: 90px;
    align-items: center;
    border-top: 1px solid rgba(15, 23, 42, 0.85);
  }

  .pmodal__thumb {
    flex: 0 0 78px;
    height: 58px;
    border-radius: 14px;
    background: #020617;
    background-size: cover;
    background-position: center;
    border: 2px solid rgba(148, 163, 184, 0.4);
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.7;
    position: relative;
    overflow: hidden;
  }

  .pmodal__thumb::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at top, rgba(15, 23, 42, 0.25), transparent 60%);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .pmodal__thumb:hover {
    opacity: 1;
    transform: translateY(-2px);
  }

  .pmodal__thumb:hover::after {
    opacity: 1;
  }

  .pmodal__thumb.is-active {
    border-color: #00347A;
    opacity: 1;
    transform: translateY(-2px);
    box-shadow: 0 8px 22px rgba(37, 99, 235, 0.6);
  }

  .pmodal__body {
    padding: 32px 28px 26px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    overflow-y: auto;
    background:
      radial-gradient(circle at top left, rgba(0, 52, 122, 0.06), transparent 55%),
      #ffffff;
    position: relative;
  }

  .pmodal__body::before {
    content: "";
    position: absolute;
    top: 0;
    left: 24px;
    right: 24px;
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(90deg, #00347A, #ff4e1f, #00347A);
    opacity: 0.9;
  }

  .pmodal__title {
    margin: 4px 0 0;
    font-size: 26px;
    font-weight: 700;
    line-height: 1.2;
    color: #0f172a;
    letter-spacing: 0.01em;
  }

  .pmodal__desc {
    margin: 0;
    color: #64748b;
    line-height: 1.6;
    font-size: 15px;
  }

  .pmodal__price {
    font-size: 24px;
    font-weight: 700;
    color: #ff4e1f;
    margin: 6px 0 4px;
  }

  .pmodal__price::before {
    content: "Investimento";
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: #94a3b8;
    margin-bottom: 2px;
  }

  .pmodal__actions {
    margin-top: auto;
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    padding-top: 10px;
    border-top: 1px dashed rgba(148, 163, 184, 0.6);
  }

  .pmodal__actions .btn {
    flex: 1;
    min-width: 150px;
    padding: 14px 22px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.22s ease;
    text-align: center;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 2px solid transparent;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12);
  }

  .pmodal__actions .add-cart {
    background: linear-gradient(135deg, #00347A, #004db8);
    color: #f9fafb;
    border-color: rgba(191, 219, 254, 0.6);
  }

  .pmodal__actions .add-cart:hover {
    background: linear-gradient(135deg, #004db8, #2563eb);
    transform: translateY(-2px);
    box-shadow: 0 14px 30px rgba(37, 99, 235, 0.45);
  }

  .pmodal__actions #pmodalWhats {
    background: #ffffff;
    color: #00347A;
    border-color: rgba(0, 52, 122, 0.75);
  }

  .pmodal__actions #pmodalWhats:hover {
    background: rgba(0, 52, 122, 0.04);
    color: #00347A;
    transform: translateY(-2px);
    box-shadow: 0 12px 26px rgba(148, 163, 184, 0.45);
  }

  .pmodal__actions .btn:focus-visible {
    outline: 3px solid rgba(0, 52, 122, 0.6);
    outline-offset: 3px;
  }

  /* Scrollbars refinados só na modal */
  .pmodal__body::-webkit-scrollbar,
  .pmodal__thumbs::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }

  .pmodal__body::-webkit-scrollbar-track,
  .pmodal__thumbs::-webkit-scrollbar-track {
    background: transparent;
  }

  .pmodal__body::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.7);
    border-radius: 999px;
  }

  .pmodal__thumbs::-webkit-scrollbar-thumb {
    background: rgba(51, 65, 85, 0.9);
    border-radius: 999px;
  }

  /* Animações */
  @keyframes pmodalSlideUp {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes pmodalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Responsivo */
  @media (max-width: 1024px) {
    .pmodal__dialog {
      grid-template-columns: 1fr;
      max-width: 720px;
      max-height: 85vh;
    }

    .pmodal__stage {
      aspect-ratio: 16/12;
    }

    .pmodal__media {
      border-right: 0;
      border-bottom: 1px solid rgba(30, 64, 175, 0.35);
    }

    .pmodal__body {
      padding: 26px 22px 22px;
    }
  }

  @media (max-width: 768px) {
    .pmodal.is-open {
      padding: 10px;
    }

    .pmodal__dialog {
      width: 100%;
      max-height: 95vh;
      border-radius: 18px;
    }

    .pmodal__title {
      font-size: 22px;
    }

    .pmodal__body {
      padding: 22px 18px 20px;
      gap: 14px;
    }

    .pmodal__actions {
      flex-direction: column;
    }

    .pmodal__actions .btn {
      flex: none;
      width: 100%;
    }

    .pmodal__close {
      top: 10px;
      right: 10px;
    }

    .pmodal__zoom-btn {
      top: 10px;
      left: 10px;
    }

    .pmodal__nav button {
      width: 42px;
      height: 42px;
      font-size: 22px;
    }

    .pmodal__thumbs {
      padding: 14px 14px 16px;
      min-height: 84px;
    }

    .pmodal__thumb {
      flex: 0 0 72px;
      height: 52px;
    }
  }

  @media (max-width: 480px) {
    .pmodal__title {
      font-size: 20px;
    }

    .pmodal__price {
      font-size: 20px;
    }

    .pmodal__actions .btn {
      padding: 13px 18px;
      font-size: 14px;
    }

    .pmodal__body::before {
      left: 18px;
      right: 18px;
    }
  }
`;

    const style = document.createElement('style');
    style.id = 'pmodalStyles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // HTML da modal com botão de zoom
  let modal = document.getElementById('productModal');
  if (!modal) {
    const tpl = document.createElement('div');
    tpl.innerHTML = `
      <div id="productModal" class="pmodal" aria-hidden="true" role="dialog" aria-labelledby="pmodalTitle">
        <div class="pmodal__dialog" role="document">
          <button class="pmodal__close" type="button" aria-label="Fechar">×</button>
          <div class="pmodal__media">
            <div class="pmodal__stage" id="pmodalStage"></div>
            <button class="pmodal__zoom-btn" type="button" aria-label="Ampliar imagem" title="Ampliar imagem">🔍</button>
            <div class="pmodal__thumbs" id="pmodalThumbs"></div>
            <div class="pmodal__nav">
              <button type="button" class="pmodal__prev" aria-label="Anterior">‹</button>
              <button type="button" class="pmodal__next" aria-label="Próxima">›</button>
            </div>
          </div>
          <div class="pmodal__body">
            <h3 id="pmodalTitle" class="pmodal__title"></h3>
            <p class="pmodal__desc" id="pmodalDesc"></p>
            <div class="pmodal__price" id="pmodalPrice"></div>
            <div class="pmodal__actions">
              <button class="btn add-cart" id="pmodalAddCart">Adicionar ao carrinho</button>
              <button class="btn" id="pmodalWhats">Quero este produto</button>
            </div>
          </div>
        </div>
        <div class="pmodal__backdrop"></div>
      </div>`;
    document.body.appendChild(tpl.firstElementChild);
    modal = document.getElementById('productModal');
  }

  // refs
  const dialog = modal.querySelector('.pmodal__dialog');
  const backdrop = modal.querySelector('.pmodal__backdrop');
  const btnClose = modal.querySelector('.pmodal__close');
  const titleEl = document.getElementById('pmodalTitle');
  const descEl = document.getElementById('pmodalDesc');
  const priceEl = document.getElementById('pmodalPrice');
  const stageEl = document.getElementById('pmodalStage');
  const thumbsEl = document.getElementById('pmodalThumbs');
  const prevBtn = modal.querySelector('.pmodal__prev');
  const nextBtn = modal.querySelector('.pmodal__next');
  const zoomBtn = modal.querySelector('.pmodal__zoom-btn');
  const addBtn = document.getElementById('pmodalAddCart');
  const whatsBtn = document.getElementById('pmodalWhats');

  let gallery = [];
  let idx = 0;
  let currentCard = null;
  let isZoomed = false;
  let zoomScale = 1.3; // Zoom mais moderado
  let panning = false;
  let startX, startY, scrollLeft, scrollTop;

  function lockScroll(lock) {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
  }

  function buildCarousel(urls) {
    stageEl.innerHTML = '';
    thumbsEl.innerHTML = '';
    gallery = urls.filter(Boolean);
    if (!gallery.length) return;

    gallery.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'pmodal__slide' + (i === 0 ? ' is-active' : '');
      slide.style.backgroundImage = `url('${src}')`;
      stageEl.appendChild(slide);

      const th = document.createElement('button');
      th.type = 'button';
      th.className = 'pmodal__thumb' + (i === 0 ? ' is-active' : '');
      th.style.backgroundImage = `url('${src}')`;
      th.addEventListener('click', () => goTo(i));
      thumbsEl.appendChild(th);
    });
    idx = 0;
    resetZoom();
  }

  function updateActive() {
    const slides = stageEl.querySelectorAll('.pmodal__slide');
    const thumbs = thumbsEl.querySelectorAll('.pmodal__thumb');
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    thumbs.forEach((t, i) => t.classList.toggle('is-active', i === idx));
  }

  function goTo(i) {
    idx = (i + gallery.length) % gallery.length;
    updateActive();
    resetZoom();
  }

  function next() { goTo(idx + 1); }
  function prev() { goTo(idx - 1); }

  // Funções de zoom e pan
  function toggleZoom() {
    const activeSlide = stageEl.querySelector('.pmodal__slide.is-active');
    if (!activeSlide) return;

    if (!isZoomed) {
      // Ativar zoom
      stageEl.classList.add('is-zoomed');
      activeSlide.classList.add('is-zoomed');
      activeSlide.style.transform = `scale(${zoomScale})`;
      zoomBtn.textContent = '✕';
      zoomBtn.setAttribute('aria-label', 'Reduzir imagem');
      zoomBtn.setAttribute('title', 'Reduzir imagem');
      isZoomed = true;

      // Centralizar a imagem ao dar zoom
      centerImage(activeSlide);

      // Desabilitar navegação durante o zoom
      prevBtn.style.pointerEvents = 'none';
      nextBtn.style.pointerEvents = 'none';
      prevBtn.style.opacity = '0.5';
      nextBtn.style.opacity = '0.5';

      // Habilitar pan
      enablePanning(activeSlide);
    } else {
      // Desativar zoom
      resetZoom();
    }
  }

  function centerImage(slide) {
    // Centralizar a imagem quando o zoom é ativado
    const stageRect = stageEl.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();

    const centerX = (stageRect.width - (slideRect.width * zoomScale)) / 2;
    const centerY = (stageRect.height - (slideRect.height * zoomScale)) / 2;

    stageEl.scrollLeft = centerX;
    stageEl.scrollTop = centerY;
  }

  function resetZoom() {
    const activeSlide = stageEl.querySelector('.pmodal__slide.is-active');
    if (activeSlide) {
      activeSlide.classList.remove('is-zoomed');
      activeSlide.style.transform = 'scale(1)';
    }
    stageEl.classList.remove('is-zoomed');
    zoomBtn.textContent = '🔍';
    zoomBtn.setAttribute('aria-label', 'Ampliar imagem');
    zoomBtn.setAttribute('title', 'Ampliar imagem');
    isZoomed = false;
    panning = false;

    // Reset scroll para o topo
    stageEl.scrollLeft = 0;
    stageEl.scrollTop = 0;

    // Reabilitar navegação
    prevBtn.style.pointerEvents = 'auto';
    nextBtn.style.pointerEvents = 'auto';
    prevBtn.style.opacity = '1';
    nextBtn.style.opacity = '1';

    // Desabilitar eventos de pan
    disablePanning();
  }

  function enablePanning(slide) {
    slide.style.cursor = 'grab';

    const startPan = (e) => {
      if (!isZoomed) return;

      panning = true;
      slide.style.cursor = 'grabbing';

      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

      startX = clientX;
      startY = clientY;
      scrollLeft = stageEl.scrollLeft;
      scrollTop = stageEl.scrollTop;

      e.preventDefault();
    };

    const doPan = (e) => {
      if (!panning) return;

      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

      const dx = clientX - startX;
      const dy = clientY - startY;

      stageEl.scrollLeft = scrollLeft - dx;
      stageEl.scrollTop = scrollTop - dy;
    };

    const stopPan = () => {
      panning = false;
      if (isZoomed) {
        slide.style.cursor = 'grab';
      }
    };

    // Mouse events
    slide.addEventListener('mousedown', startPan);
    document.addEventListener('mousemove', doPan);
    document.addEventListener('mouseup', stopPan);

    // Touch events
    slide.addEventListener('touchstart', startPan, { passive: false });
    document.addEventListener('touchmove', doPan, { passive: false });
    document.addEventListener('touchend', stopPan);

    // Store events for cleanup
    slide._panEvents = { startPan, doPan, stopPan };
  }

  function disablePanning() {
    const activeSlide = stageEl.querySelector('.pmodal__slide.is-active');
    if (!activeSlide || !activeSlide._panEvents) return;

    const { startPan, doPan, stopPan } = activeSlide._panEvents;

    activeSlide.removeEventListener('mousedown', startPan);
    document.removeEventListener('mousemove', doPan);
    document.removeEventListener('mouseup', stopPan);

    activeSlide.removeEventListener('touchstart', startPan);
    document.removeEventListener('touchmove', doPan);
    document.removeEventListener('touchend', stopPan);

    delete activeSlide._panEvents;
  }

  // Event listeners
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  zoomBtn.addEventListener('click', toggleZoom);

  // Zoom com duplo clique na imagem
  stageEl.addEventListener('dblclick', (e) => {
    if (e.target.classList.contains('pmodal__slide')) {
      toggleZoom();
    }
  });

  // Swipe (touch) - desabilitar durante o zoom
  (function enableSwipe() {
    let x0 = null;
    let y0 = null;

    stageEl.addEventListener('touchstart', (e) => {
      if (isZoomed) return; // Não capturar swipe durante zoom
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });

    stageEl.addEventListener('touchend', (e) => {
      if (isZoomed || x0 == null) return;

      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;

      // Só considera swipe se o movimento horizontal for maior que o vertical
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        dx > 0 ? prev() : next();
      }
      x0 = null;
      y0 = null;
    });
  })();

  function getCardPrimaryImage(card) {
    const imgNode = card.querySelector('.card__img');
    let url = imgNode?.getAttribute('data-full') || '';
    if (!url && imgNode?.style?.backgroundImage) {
      const m = imgNode.style.backgroundImage.match(/url\\(["']?(.*?)["']?\\)/);
      if (m && m[1]) url = m[1];
    }
    return url;
  }

  function formatPrice(price) {
    if (!price || price === 0) return 'Preço sob consulta';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  function openWithCard(card) {
    currentCard = card;

    const title = card.querySelector('h4')?.textContent?.trim() || 'Produto Luna';
    const desc = card.getAttribute('data-desc') || card.querySelector('.card__body p')?.textContent?.trim() || '';
    const galleryAttr = (card.getAttribute('data-gallery') || '').split('|').map(s => s.trim()).filter(Boolean);
    const primary = getCardPrimaryImage(card);
    const imgs = galleryAttr.length ? galleryAttr : (primary ? [primary] : []);

    // Obter preço
    const priceAttr = card.getAttribute('data-price-num');
    const priceSpan = card.querySelector('[data-price]');
    let price = 0;
    if (priceAttr) {
      price = Number(priceAttr);
    } else if (priceSpan && priceSpan.textContent && priceSpan.textContent !== 'Consultar') {
      const raw = priceSpan.textContent.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
      price = Number(raw || 0);
    }

    titleEl.textContent = title;
    descEl.textContent = desc;
    priceEl.textContent = formatPrice(price);
    buildCarousel(imgs);

    // ações
    addBtn.onclick = () => {
      const id = card.getAttribute('data-sku') || title.toLowerCase().replace(/\s+/g, '-').slice(0, 60);
      const img = imgs[0] || primary || '';
      if (typeof window.addToCart === 'function') {
        window.addToCart({ id, title, price, img });
      } else {
        pushToast(`"${title}" adicionado ao carrinho`);
      }
      close();
    };

    whatsBtn.onclick = () => {
      const baseZap = 'https://wa.me/5581992225420?text=';
      const msg = encodeURIComponent(`Olá, vim do site e me interessei por: ${title}. Poderiam enviar mais detalhes?`);
      const w = window.open(baseZap + msg, '_blank');
      if (w && w.opener) w.opener = null;
    };

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    setTimeout(() => btnClose.focus(), 10);
  }

  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    lockScroll(false);
    stageEl.innerHTML = '';
    thumbsEl.innerHTML = '';
    resetZoom();
  }

  // Event listeners para fechar
  backdrop.addEventListener('click', close);
  btnClose.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      if (isZoomed) {
        resetZoom();
      } else {
        close();
      }
    }
  });

  // DESATIVAR COMPLETAMENTE O LIGHTBOX - Abrir apenas a modal
  document.addEventListener('click', (e) => {
    const viaBtn = e.target.closest('[data-quickview]');
    const viaImg = e.target.closest('.card__img');
    const card = (viaBtn || viaImg)?.closest('.card');

    if (!card) return;

    // Prevenir completamente qualquer outro comportamento
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    openWithCard(card);
  });

  // Remover completamente o event listener do lightbox se existir
  document.addEventListener('DOMContentLoaded', () => {
    // Remover qualquer evento de clique nas imagens dos cards
    $$('.card__img').forEach(img => {
      img.replaceWith(img.cloneNode(true));
    });

    // Também remover o lightbox do DOM se existir
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
      lightbox.remove();
    }
  });
})();


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
     (atalho "/" + integra com filtros)
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

    let t = null;
    function emit() {
      window.__searchTerm = norm(input.value || "");
      document.dispatchEvent(new CustomEvent('search:changed', { detail: { term: window.__searchTerm } }));
    }
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(emit, 180); });
    btn?.addEventListener('click', emit);
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
      const cardImg = e.target.closest('.card__img');
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
    const CART_KEY = 'luna_cart_v1';
    const zapPhone = '5581992225420';

    const els = {
      toggles: [ $('#cartToggle'), $('#cartToggleMobile') ].filter(Boolean),
      close: $('#cartClose'),
      drawer: $('#cartDrawer'),
      backdrop: $('#cartBackdrop'),
      list: $('#cartList'),
      counts: [ $('#cartCount'), $('#cartCountMobile') ].filter(Boolean),
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
      const thumb = card.querySelector('.card__img');
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
      // fallback manual (se preferir): window.alert('Item adicionado ao carrinho');
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
    els.toggles.forEach(b => b.addEventListener('click', open));
    els.close?.addEventListener('click', close);
    els.backdrop?.addEventListener('click', close);
    els.checkout?.addEventListener('click', checkoutWhatsApp);

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

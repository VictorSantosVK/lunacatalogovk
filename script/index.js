
/* ===========================
   Utils
=========================== */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const norm = (txt) => (txt || "").toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // remove acentos

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
    const baseZap = 'https://wa.me/5581994993316?text=';
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
   Carrinho (drawer) — v2
   - UI refinada
   - Bloqueio de rolagem
   - Fechar com ESC / clique fora
   - Mensagem WhatsApp com total
=========================== */
(function initCart() {
  const CART_KEY = 'luna_cart_v1';
  const zapPhone = '5581994993316';

  const els = {
    toggle: $('#cartToggle') || $('#openCart'),
    close: $('#cartClose'),
    drawer: $('#cartDrawer'),
    backdrop: $('#cartBackdrop'),
    list: $('#cartList'),
    count: $('#cartCount'),
    totalsBox: $('#cartDrawer .cart-totals'),
    checkout: $('#cartCheckout'),
  };

  const state = { items: load() }; // [{id,title,qty,price,img}]
  const money = n => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function load() { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; } }
  function save() { localStorage.setItem(CART_KEY, JSON.stringify(state.items)); }

  /* ----- Helpers UI ----- */
  function lockScroll(lock) {
    document.documentElement.style.overflow = lock ? 'hidden' : '';
    document.body.style.overflow = lock ? 'hidden' : '';
  }

  function open() {
    if (!els.drawer) return;
    els.drawer.classList.add('is-open');
    els.drawer.setAttribute('aria-hidden', 'false');
    if (els.backdrop) {
      els.backdrop.hidden = false;
      requestAnimationFrame(() => els.backdrop.classList.add('show'));
    }
    lockScroll(true);
  }
  function close() {
    if (!els.drawer) return;
    els.drawer.classList.remove('is-open');
    els.drawer.setAttribute('aria-hidden', 'true');
    if (els.backdrop) {
      els.backdrop.classList.remove('show');
      setTimeout(() => (els.backdrop.hidden = true), 160);
    }
    lockScroll(false);
  }

  /* ----- Pega dados do card ----- */
  function getCardData(card) {
    const title = card.querySelector('h4')?.textContent?.trim() || 'Produto Luna';
    const priceAttr = card.getAttribute('data-price-num');
    const priceSpan = card.querySelector('[data-price]');
    let price = 0;
    if (priceAttr) {
      price = Number(priceAttr);
    } else if (priceSpan && priceSpan.textContent && priceSpan.textContent !== 'Consultar') {
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

  /* ----- Mutations ----- */
  function add(item) {
    const found = state.items.find(x => x.id === item.id);
    found ? (found.qty += 1) : state.items.push({ ...item, qty: 1 });
    save(); render(); open();
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
  function clear() { state.items = []; save(); render(); }

  /* ----- Render ----- */
  function renderTotals() {
    if (!els.totalsBox) return;
    const items = state.items.reduce((a, b) => a + b.qty, 0);


    els.totalsBox.innerHTML = `
      <div class="totals-row">
      </div>
      <div class="totals-row totals-row--total">
        <span>Total</span><strong>${money(total)}</strong>
      </div>
      <small class="totals-hint">Valores sujeitos a confirmação. Frete sob consulta.</small>
    `;

    if (els.checkout) {
      els.checkout.disabled = items === 0;
      els.checkout.classList.toggle('is-disabled', items === 0);
    }
  }

  function renderList() {
    if (!els.list) return;
    els.list.innerHTML = '';
    if (!state.items.length) {
      els.list.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty__icon">🛒</div>
          <p>Seu carrinho está vazio.</p>
          <a href="#portas" class="btn btn-outline">Ver produtos</a>
        </div>`;
      return;
    }
    state.items.forEach(it => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item__img" style="background-image:url('${(it.img || '').replace(/'/g,"\\'")}')"></div>
        <div class="cart-item__main">
          <div class="cart-item__title">${it.title}</div>
          <div class="cart-item__meta">${it.price ? money(it.price) : 'Sob consulta'}</div>
          <div class="cart-item__controls" role="group" aria-label="Quantidade">
            <button type="button" data-dec="${it.id}" aria-label="Diminuir">−</button>
            <input type="text" inputmode="numeric" pattern="[0-9]*" value="${it.qty}" data-qty="${it.id}" aria-label="Quantidade">
            <button type="button" data-inc="${it.id}" aria-label="Aumentar">+</button>
            <button type="button" class="cart-item__remove" data-del="${it.id}" aria-label="Remover item">Remover</button>
          </div>
        </div>
        <div class="cart-item__total">${it.price ? money(it.price * it.qty) : ''}</div>
      `;
      els.list.appendChild(row);
    });
  }

  function renderCount() {
    const totalQty = state.items.reduce((a, b) => a + b.qty, 0);
    if (els.count) els.count.textContent = totalQty;
  }

  function render() {
    renderCount();
    renderList();
    renderTotals();
  }

  /* ----- Delegação de eventos (lista) ----- */
  els.list?.addEventListener('click', (e) => {
    const dec = e.target.closest('[data-dec]');
    const inc = e.target.closest('[data-inc]');
    const del = e.target.closest('[data-del]');
    if (dec) {
      const id = dec.getAttribute('data-dec');
      const input = els.list.querySelector(`input[data-qty="${id}"]`);
      const curr = parseInt(input?.value || '1', 10) || 1;
      setQty(id, curr - 1);
    } else if (inc) {
      const id = inc.getAttribute('data-inc');
      const input = els.list.querySelector(`input[data-qty="${id}"]`);
      const curr = parseInt(input?.value || '1', 10) || 1;
      setQty(id, curr + 1);
    } else if (del) {
      const id = del.getAttribute('data-del');
      removeItem(id);
    }
  });

  els.list?.addEventListener('input', (e) => {
    const input = e.target.closest('input[data-qty]');
    if (!input) return;
    const id = input.getAttribute('data-qty');
    const val = parseInt(input.value.replace(/\D/g, ''), 10) || 0;
    setQty(id, Math.min(999, Math.max(0, val)));
  });

  /* ----- Checkout WhatsApp ----- */
  function checkoutWhatsApp() {
    if (!state.items.length) { alert('Seu carrinho está vazio.'); return; }
    const lines = state.items.map(it => {
      const preco = it.price ? ` — ${money(it.price)} x ${it.qty} = ${money((it.price || 0) * it.qty)}` : ` — ${it.qty} un. (consultar preço)`;
      return `• ${it.title}${preco}`;
    });
    const total = state.items.reduce((a, b) => a + ((b.price || 0) * b.qty), 0);
    const msg = [
      'Olá! Gostaria de finalizar este pedido:',
      ...lines,
      '',
      `Total: ${money(total)}`,
      '',
      'Vim do site da Luna Portas & Janelas.'
    ].join('\n');
    const url = `https://wa.me/${zapPhone}?text=${encodeURIComponent(msg)}`;
    const w = window.open(url, '_blank'); if (w && w.opener) w.opener = null;
  }

  /* ----- Botões globais / overlay / esc ----- */
  els.toggle?.addEventListener('click', open);
  els.close?.addEventListener('click', close);
  els.backdrop?.addEventListener('click', close);
  els.checkout?.addEventListener('click', checkoutWhatsApp);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.drawer?.classList.contains('is-open')) close();
  });

  /* ----- Adicionar ao carrinho nos cards ----- */
  $$('[data-add="cart"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.currentTarget.closest('.card'); if (!card) return;
      add(getCardData(card));
    });
  });

  /* Render inicial */
  render();

  /* Exponha funções se precisar usar em outros scripts */
  window.LunaCart = { add, removeItem, setQty, clear, open, close, render };
})()})

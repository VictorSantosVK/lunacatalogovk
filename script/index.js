/* ==========================================================================
  LUNA — PORTAS & JANELAS — scripts.js (REFEITO)
  - 1 único DOMContentLoaded
  - sem duplicidades (carrinho / promo / modal)
  - remove Lightbox (fica só Quick View Modal)
  - delegação de eventos (menos listeners, mais robusto)
  - NOVO: esconder data-desc do HTML, mas manter no ícone "Descrição" do modal
  - NOVO: remover fallback que pegava o <p> do preço como descrição ("a partir de R$ Consultar")
  ========================================================================== */

/* ===========================
  Utils
=========================== */


function initProductSwitcher() {
  const smooth = prefersReducedMotion() ? "auto" : "smooth";
  portas.scrollIntoView({ behavior: smooth, block: "start" });

  const portas = document.getElementById("portas");
  const janelas = document.getElementById("janelas");
  if (!portas || !janelas) return;

  const buttons = document.querySelectorAll("[data-show]");

  function show(target) {
    if (target === "portas") {
      portas.style.display = "";
      janelas.style.display = "none";
      portas.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (target === "janelas") {
      janelas.style.display = "";
      portas.style.display = "none";
      janelas.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // all
      portas.style.display = "";
      janelas.style.display = "";
      // opcional: rolar para o topo das seções
      portas.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-show]");
    if (!btn) return;
    const target = btn.getAttribute("data-show");
    show(target);
  });
}




const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const norm = (txt) =>
  (txt || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const moneyBRL = (n) =>
  Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const prefersReducedMotion = () =>
  window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const WHATSAPP_NUMBERS = [
  "558193931465",
  
];

function getNextWhatsAppUrl(message) {
  if (!WHATSAPP_NUMBERS.length) return "";

  // Sorteio dos números disponíveis:
  const randomIndex = Math.floor(Math.random() * WHATSAPP_NUMBERS.length);
  const phone = WHATSAPP_NUMBERS[randomIndex];
  return `https://wa.me/${phone}?text=${message}`;
}

function getPrimaryImageUrl(card) {
  const imgNode = card.querySelector(".p-card__img") || card.querySelector(".card__img");
  if (!imgNode) return "";

  let url = imgNode.getAttribute("data-full") || "";

  if (!url && imgNode.style?.backgroundImage) {
    const m = imgNode.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    if (m && m[1]) url = m[1];
  }
  return url;
}

/* ===========================
  NOVO: Cache de descrições (esconde do HTML, mas mantém no modal)
  - Guarda data-desc em memória (Map)
  - Remove data-desc do DOM (não aparece no inspetor)
  - Também guarda data-details (se existir) e remove (opcional)
=========================== */
const __DESC_MAP__ = new Map();    // key -> desc/details
const __DETAILS_MAP__ = new Map(); // key -> details (se existir)

function getCardKey(card) {
  // chave estável: prioriza SKU
  return (
    card.getAttribute("data-sku") ||
    card.querySelector("h4")?.textContent?.trim() ||
    ""
  );
}

function cacheAndHideDescriptions() {
  const cards = $$(".card");
  cards.forEach((card) => {
    const key = getCardKey(card);
    if (!key) return;

    // data-details (preferência para o accordion)
    const details = card.getAttribute("data-details");
    if (details) {
      __DETAILS_MAP__.set(key, details);
      card.removeAttribute("data-details"); // esconde do HTML
    }

    // data-desc (descrição original)
    const desc = card.getAttribute("data-desc");
    if (desc) {
      __DESC_MAP__.set(key, desc);
      card.removeAttribute("data-desc"); // esconde do HTML
    }
  });
}
document.querySelectorAll('img:not([loading])').forEach(img => {
  if (img.closest(".navbar-brand") || img.closest("#heroCarousel")) return;
  img.loading = "lazy";
});


/* ===========================
  Toast (push)
=========================== */
function ensureToastContainer() {
  let stack = document.getElementById("toastContainer");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toastContainer";
    stack.setAttribute("aria-live", "polite");
    stack.setAttribute("aria-atomic", "true");
    stack.style.position = "fixed";
    stack.style.right = "16px";
    stack.style.bottom = "16px";
    stack.style.display = "grid";
    stack.style.gap = "8px";
    stack.style.zIndex = "2000";
    document.body.appendChild(stack);
  }
  return stack;
}

function pushToast(message = "Item adicionado ao carrinho") {
  const stack = ensureToastContainer();
  if (!stack) {
    alert(message);
    return;
  }

  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.gap = "10px";
  el.style.padding = "10px 12px";
  el.style.borderRadius = "12px";
  el.style.background = "#0f172a";
  el.style.color = "#fff";
  el.style.boxShadow = "0 10px 20px rgba(0,0,0,.2)";
  el.style.fontWeight = "600";
  el.style.transition = "transform .16s ease, opacity .16s ease";
  el.style.transform = "translateY(8px)";
  el.style.opacity = "0.95";

  el.innerHTML = `
      <span style="display:inline-grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#10b981;font-weight:800">✓</span>
      <span style="line-height:1.2">${message}</span>
      <button aria-label="Fechar notificação" style="margin-left:auto;background:transparent;border:0;color:#fff;font-size:20px;line-height:1;cursor:pointer">×</button>
    `;

  const remove = () => {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    setTimeout(() => el.remove(), 180);
  };

  el.querySelector("button")?.addEventListener("click", remove);

  stack.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = "translateY(0)";
    el.style.opacity = "1";
  });
  setTimeout(remove, 2600);
}

/* ===========================
  Navegação / UX
=========================== */
function initYearFooter() {
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

function initSmoothAnchors() {
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (href && href.length > 1) {
        const target = $(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });
}

function initStickyShadow() {
  const header = $("header.sticky-top");
  if (!header) return;

  const onScroll = () => header.classList.toggle("is-sticky", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ===========================
  Promo bar rotativa
=========================== */
function initPromoRotation() {
  const texts = $$(".promo-bar .promo-text");
  if (texts.length <= 1) return;
  if (prefersReducedMotion()) return;

  let current = 0;
  let timer = null;

  texts.forEach((t, i) => t.classList.toggle("active", i === 0));

  function next() {
    texts[current].classList.remove("active");
    current = (current + 1) % texts.length;
    texts[current].classList.add("active");
  }

  function start() {
    stop();
    timer = setInterval(next, 4000);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  const bar = $(".promo-bar");

  function pauseTemporarily(ms = 5000) {
    stop();
    clearTimeout(bar.__resumeTimer);
    bar.__resumeTimer = setTimeout(start, ms);
  }

  bar?.addEventListener("mouseenter", stop);
  bar?.addEventListener("mouseleave", start);

  // ✅ mobile-friendly
  bar?.addEventListener("touchstart", () => pauseTemporarily(6000), { passive: true });
  bar?.addEventListener("click", () => pauseTemporarily(6000));


  start();
}

/* ===========================
  WhatsApp CTA (cards)
=========================== */

function initFloatingWhatsApp() {
  document.addEventListener("click", (e) => {
    const link = e.target.closest("a.zap");
      if (link.href && link.href.includes("tintim.link/whatsapp/")) {
      return;
    }
    if (!link) return;

    e.preventDefault();

    const msg = encodeURIComponent(
      "Olá, vim do site da Luna e quero um orçamento."
    );

    const zapUrl = getNextWhatsAppUrl(msg);
    if (!zapUrl) return;

    const w = window.open(zapUrl, "_blank");
    if (w && w.opener) w.opener = null;
  });
}


function initWhatsAppCTA() {

  document.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-cta="whats"]');
    if (!btn) return;

    const card = btn.closest(".card");
    const title = card?.querySelector("h4")?.textContent?.trim() || "Produto Luna";
    const msg = encodeURIComponent(
      `Olá, vim do site e me interessei por: ${title}. Poderiam enviar mais detalhes?`
    );
    const zapUrl = getNextWhatsAppUrl(msg);
    if (!zapUrl) return;
    const w = window.open(zapUrl, "_blank");
    if (w && w.opener) w.opener = null;
  });
}

/* ===========================
  Hover preview de imagem (cards)
=========================== */
function initHoverGallery() {
  const cards = $$(".card[data-gallery]");

  cards.forEach((card) => {
    const gallery = (card.getAttribute("data-gallery") || "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);

    if (gallery.length < 2) return;

    const imgEl = card.querySelector(".p-card__img") || card.querySelector(".card__img");
    if (!imgEl) return;

    const primary = getPrimaryImageUrl(card) || gallery[0];
    const hoverImg = gallery[1];

    const defaultBg = imgEl.style.backgroundImage || (primary ? `url('${primary}')` : "");

    const showHover = () => {
      if (!hoverImg) return;
      imgEl.style.backgroundImage = `url('${hoverImg}')`;
    };

    const showPrimary = () => {
      if (defaultBg) imgEl.style.backgroundImage = defaultBg;
      else if (primary) imgEl.style.backgroundImage = `url('${primary}')`;
    };

    card.addEventListener("mouseenter", showHover);
    card.addEventListener("mouseleave", showPrimary);
    card.addEventListener("focusin", showHover);
    card.addEventListener("focusout", showPrimary);
  });
}

/* ===========================
  Hero Carousel
=========================== */
function initHeroCarousel() {
  const root = $("#heroCarousel");
  if (!root) return;

  const slides = $$(".car-slide", root);
  const prev = $(".car-btn.prev", root);
  const next = $(".car-btn.next", root);
  const dotsEl = $(".car-dots", root);

  if (!slides.length) return;
  if (slides.length === 1) {
    slides[0].classList.add("is-active");
    return;
  }

  let idx = 0;
  let timer = null;
  const AUTOPLAY_MS = 4500;

  if (dotsEl) {
    dotsEl.innerHTML = "";
    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.className = "car-dot" + (i === 0 ? " is-active" : "");
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `Ir para imagem ${i + 1}`);
      b.addEventListener("click", () => goTo(i, true));
      dotsEl.appendChild(b);
    });
  }
  const dots = $$(".car-dot", root);

  function show(i) {
    slides.forEach((s) => s.classList.remove("is-active"));
    dots.forEach((d) => d.classList.remove("is-active"));
    slides[i].classList.add("is-active");
    dots[i]?.classList.add("is-active");
  }

  function goTo(i, user = false) {
    idx = (i + slides.length) % slides.length;
    show(idx);
    if (user) restartAutoplay();
  }

  function nextSlide() {
    goTo(idx + 1);
  }
  function prevSlide() {
    goTo(idx - 1);
  }

  prev?.addEventListener("click", prevSlide);
  next?.addEventListener("click", nextSlide);

  root.setAttribute("tabindex", "0");
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    }
  });

  function startAutoplay() {
    if (prefersReducedMotion()) return;
    stopAutoplay();
    timer = setInterval(nextSlide, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", startAutoplay);
  document.addEventListener("visibilitychange", () =>
    document.hidden ? stopAutoplay() : startAutoplay()
  );

  show(idx);
  startAutoplay();
}

/* ===========================
  Busca global no header + integração filtros
=========================== */
function initHeaderSearch() {
  const form = $("#siteSearch");
  const input = $("#searchInput");
  const btn = form?.querySelector(".search-btn");
  if (!form || !input) return;

  window.__searchTerm = "";

  window.addEventListener("keydown", (e) => {
    const t = e.target;
    const typing =
      t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (!typing && e.key === "/") {
      e.preventDefault();
      input.focus();
    }
  });

  let t = null;
  function emit() {
    window.__searchTerm = norm(input.value || "");
    document.dispatchEvent(
      new CustomEvent("search:changed", { detail: { term: window.__searchTerm } })
    );
  }

  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(emit, 180);
  });
  btn?.addEventListener("click", emit);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = norm(input.value || "");
    if (!q) return;

    $$(".card.is-highlight").forEach((c) => c.classList.remove("is-highlight"));

    const cards = $$(".card");
    let match = null;

    for (const card of cards) {
      const title = norm(card.querySelector("h4")?.textContent);
      const badge = norm(card.querySelector(".badge-mini")?.textContent);

      // mantém busca por "extra", mas NÃO use isso como descrição do modal!
      const extra = norm(card.querySelector(".card__body p")?.textContent);

      const line = norm(card.getAttribute("data-line"));
      const spec = norm(card.getAttribute("data-spec"));

      if (
        (title && title.includes(q)) ||
        (badge && badge.includes(q)) ||
        (extra && extra.includes(q)) ||
        (line && line.includes(q)) ||
        (spec && spec.includes(q))
      ) {
        match = card;
        break;
      }
    }

    if (match) {
      match.classList.add("is-highlight");
      match.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => match.classList.remove("is-highlight"), 3500);
    } else {
      pushToast("Produto não encontrado. Tente outro termo.");
    }
  });
}

/* ===========================
  Filtros (Portas & Janelas)
=========================== */
function initAllFilters() {
  function initFilters(scopeName) {
    const scope = $(`.filters[data-scope="${scopeName}"]`);
    const grid = $(`.grid[data-grid="${scopeName}"]`);
    if (!scope || !grid) return;

    let currentLine = "*";
    let currentSpec = "*";

    const lineBtns = $$("[data-filter-line]", scope);
    const specBtns = $$("[data-filter-spec]", scope);
    const countEl = $("[data-count]", scope);

    function setActive(btns, attr, value) {
      btns.forEach((b) => b.classList.toggle("is-active", b.getAttribute(attr) === value));
    }

    function apply() {
      const cards = $$(".card", grid);
      let visible = 0;
      const term = window.__searchTerm || "";

      cards.forEach((card) => {
        const line = (card.getAttribute("data-line") || "").trim();
        const spec = (card.getAttribute("data-spec") || "").trim();

        const title = norm(card.querySelector("h4")?.textContent || "");
        const badge = norm(card.querySelector(".badge-mini")?.textContent || "");

        // aqui pode continuar pegando o <p> do card (serve pra filtro/busca),
        // mas NÃO usamos mais isso como descrição do modal
        const extra = norm(card.querySelector(".card__body p")?.textContent || "");

        const nLine = norm(line);
        const nSpec = norm(spec);

        const okLine = currentLine === "*" || line === currentLine;
        const okSpec = currentSpec === "*" || spec === currentSpec;
        const okTerm =
          !term ||
          title.includes(term) ||
          badge.includes(term) ||
          extra.includes(term) ||
          nLine.includes(term) ||
          nSpec.includes(term);

        const show = okLine && okSpec && okTerm;
        card.style.display = show ? "" : "none";
        if (show) visible++;
      });

      if (countEl) countEl.textContent = visible;
    }

    apply();

    lineBtns.forEach((b) =>
      b.addEventListener("click", () => {
        currentLine = b.getAttribute("data-filter-line");
        setActive(lineBtns, "data-filter-line", currentLine);
        apply();
      })
    );

    specBtns.forEach((b) =>
      b.addEventListener("click", () => {
        currentSpec = b.getAttribute("data-filter-spec");
        setActive(specBtns, "data-filter-spec", currentSpec);
        apply();
      })
    );

    document.addEventListener("search:changed", apply);
  }

  initFilters("portas");
  initFilters("janelas");
}

/* ===========================
  Carrinho (drawer) — v2
=========================== */
function initCart() {
  const CART_KEY = "luna_cart_v1";

  const els = {
    toggles: [$("#cartToggle"), $("#cartToggleMobile")].filter(Boolean),
    close: $("#cartClose"),
    drawer: $("#cartDrawer"),
    backdrop: $("#cartBackdrop"),
    list: $("#cartList"),
    counts: [$("#cartCount"), $("#cartCountMobile")].filter(Boolean),
    checkout: $("#cartCheckout"),
  };

  if (!els.drawer || !els.list) return;

  const state = { items: load() };

  function load() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function save() {
    localStorage.setItem(CART_KEY, JSON.stringify(state.items));
  }

  function open() {
    els.drawer.classList.add("is-open");
    els.drawer.setAttribute("aria-hidden", "false");
    if (els.backdrop) {
      els.backdrop.hidden = false;
      els.backdrop.classList.add("show");
    }
  }

  function close() {
    els.drawer.classList.remove("is-open");
    els.drawer.setAttribute("aria-hidden", "true");
    if (els.backdrop) {
      els.backdrop.classList.remove("show");
      els.backdrop.hidden = true;
    }
  }

  function getCardData(card) {
    const title = card.querySelector("h4")?.textContent?.trim() || "Produto Luna";

    const priceAttr = card.getAttribute("data-price-num");
    const priceSpan = card.querySelector("[data-price]");
    let price = 0;

    if (priceAttr) {
      price = Number(priceAttr);
    } else if (priceSpan && priceSpan.textContent && priceSpan.textContent !== "Consultar") {
      const raw = priceSpan.textContent
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "");
      price = Number(raw || 0);
    }

    const thumb = card.querySelector(".card__img");
    let img = thumb?.getAttribute("data-full") || "";
    if (!img && thumb?.style?.backgroundImage) {
      const m = thumb.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
      if (m && m[1]) img = m[1];
    }

    const id =
      card.getAttribute("data-sku") ||
      title.toLowerCase().replace(/\s+/g, "-").slice(0, 60);

    return { id, title, price, img };
  }

  function add(item) {
    const found = state.items.find((x) => x.id === item.id);
    if (found) found.qty += 1;
    else state.items.push({ ...item, qty: 1 });

    save();
    render();
    pushToast(`“${item.title}” adicionado ao carrinho`);
  }

  function removeItem(id) {
    state.items = state.items.filter((x) => x.id !== id);
    save();
    render();
  }

  function setQty(id, q) {
    const it = state.items.find((x) => x.id === id);
    if (!it) return;

    const qty = parseInt(q, 10) || 1;
    if (qty <= 0) removeItem(id);
    else {
      it.qty = qty;
      save();
      render();
    }
  }

  function render() {
    const totalQty = state.items.reduce((a, b) => a + b.qty, 0);
    els.counts.forEach((c) => c && (c.textContent = totalQty));

    els.list.innerHTML = "";
    if (!state.items.length) {
      els.list.innerHTML = '<p style="color:var(--muted)">Seu carrinho está vazio.</p>';
      return;
    }

    state.items.forEach((it) => {
      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
          <div class="cart-item__img" style="background-image:url('${it.img || ""}')"></div>
          <div>
            <div class="cart-item__title">${it.title}</div>
            <div class="cart-item__meta">${it.price ? moneyBRL(it.price) : "Sob consulta"}</div>
            <div class="cart-item__qty" aria-label="Quantidade">
              <button type="button" data-dec="${it.id}" aria-label="Diminuir">-</button>
              <span data-qty="${it.id}">${it.qty}</span>
              <button type="button" data-inc="${it.id}" aria-label="Aumentar">+</button>
              <button type="button" class="cart-item__remove" data-del="${it.id}" aria-label="Remover">remover</button>
            </div>
          </div>
          <div style="font-weight:700">${it.price ? moneyBRL(it.price * it.qty) : ""}</div>
        `;
      els.list.appendChild(row);
    });
  }

  function checkoutWhatsApp() {
    if (!state.items.length) {
      alert("Seu carrinho está vazio.");
      return;
    }

    const lines = state.items.map((it) => {
      const preco = it.price
        ? ` — ${moneyBRL(it.price)} x ${it.qty}`
        : ` — ${it.qty} un. (consultar preço)`;
      return `• ${it.title}${preco}`;
    });

    const msg = [
      "Olá! Gostaria de finalizar este pedido:",
      ...lines,
      "",
      "Vim do site da Luna Portas & Janelas.",
    ].join("\n");

    const zapUrl = getNextWhatsAppUrl(encodeURIComponent(msg));
    if (!zapUrl) return;

    const w = window.open(zapUrl, "_blank");
    if (w && w.opener) w.opener = null;
  }


  window.addToCart = (item) => add(item);

  els.toggles.forEach((b) =>
    b.addEventListener("click", () =>
      els.drawer.classList.contains("is-open") ? close() : open()
    )
  );
  els.close?.addEventListener("click", close);
  els.backdrop?.addEventListener("click", close);
  els.checkout?.addEventListener("click", checkoutWhatsApp);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.drawer.classList.contains("is-open")) close();
  });

  els.list.addEventListener("click", (e) => {
    const dec = e.target.closest("[data-dec]");
    const inc = e.target.closest("[data-inc]");
    const del = e.target.closest("[data-del]");

    if (dec) {
      const id = dec.getAttribute("data-dec");
      const span = els.list.querySelector(`span[data-qty="${id}"]`);
      const curr = parseInt(span?.textContent || "1", 10) || 1;
      setQty(id, curr - 1);
    } else if (inc) {
      const id = inc.getAttribute("data-inc");
      const span = els.list.querySelector(`span[data-qty="${id}"]`);
      const curr = parseInt(span?.textContent || "1", 10) || 1;
      setQty(id, curr + 1);
    } else if (del) {
      const id = del.getAttribute("data-del");
      removeItem(id);
    }
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-add="cart"]');
    if (!btn) return;

    const card = btn.closest(".card");
    if (!card) return;

    add(getCardData(card));
  });

  render();
}

/* ===========================
  Quick View Modal (carrossel + zoom/pan)
=========================== */
function ensureQuickViewModal() {
  if (!document.getElementById("pmodalStyles")) {
    const style = document.createElement("style");
    style.id = "pmodalStyles";
    style.textContent = `
  /* ===== Quick View com carrossel de imagens - VERSÃO LUNA ===== */
  .pmodal { position: fixed; inset: 0; z-index: 9999; display: none; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  .pmodal.is-open { display: flex; align-items: center; justify-content: center; padding: 20px; }
  .pmodal__backdrop { position: absolute; inset: 0; background: radial-gradient(circle at top, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.98)); backdrop-filter: blur(6px); animation: pmodalFadeIn 0.3s ease-out; }
  .pmodal__dialog { position: relative; z-index: 1; width: 95%; max-width: 1200px; max-height: 90vh; background: radial-gradient(circle at top left, rgba(0, 52, 122, 0.05), transparent 55%), #ffffff; color: #0b1220; border-radius: 20px; box-shadow: 0 34px 80px rgba(15, 23, 42, 0.55), 0 0 0 1px rgba(148, 163, 184, 0.35); overflow: hidden; display: grid; grid-template-columns: 1.2fr 1fr; animation: pmodalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); transform-origin: center center; }
  .pmodal__close { position: absolute; top: 16px; right: 16px; width: 40px; height: 40px; border-radius: 999px; border: 0; background: rgba(255,255,255,0.95); color: #0f172a; font-size: 24px; font-weight: 400; line-height: 1; cursor: pointer; display: grid; place-items: center; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.35); transition: all 0.2s ease; z-index: 10; border: 1px solid rgba(148, 163, 184, 0.45); backdrop-filter: blur(8px); }
  .pmodal__close:hover { background: #f8fafc; transform: translateY(-1px) scale(1.03); border-color: #e2e8f0; }
  .pmodal__media { background: radial-gradient(circle at top, #020617, #020617 40%, #0b1120 100%); display: grid; grid-template-rows: 1fr auto; position: relative; overflow: hidden; border-right: 1px solid rgba(30, 64, 175, 0.35); }
  .pmodal__stage { position: relative; aspect-ratio: 1/1; overflow: hidden; background: radial-gradient(circle at top, rgba(15,23,42,0.9), rgba(15,23,42,1)), #020617; cursor: zoom-in; }
  .pmodal__stage.is-zoomed { cursor: grab; overflow: auto; }
  .pmodal__stage.is-zoomed:active { cursor: grabbing; }
  .pmodal__slide { position: absolute; inset: 0; background-size: contain; background-repeat: no-repeat; background-position: center; opacity: 0; transition: opacity 0.3s ease, transform 0.3s ease; cursor: inherit; }
  .pmodal__slide.is-active { opacity: 1; }
  .pmodal__slide.is-zoomed { background-size: auto; cursor: inherit; min-width: 100%; min-height: 100%; transform-origin: 0 0; }
  .pmodal__nav { position: absolute; inset: 0; display: flex; align-items: center; justify-content: space-between; pointer-events: none; padding: 0 18px; z-index: 2; }
  .pmodal__nav button { pointer-events: auto; width: 46px; height: 46px; border-radius: 999px; border: 0; background: rgba(15, 23, 42, 0.86); color: #e5e7eb; font-size: 24px; font-weight: 300; cursor: pointer; display: grid; place-items: center; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45); transition: all 0.2s ease; backdrop-filter: blur(8px); border: 1px solid rgba(148, 163, 184, 0.45); }
  .pmodal__nav button:hover { background: rgba(15, 23, 42, 0.98); transform: translateY(-1px) scale(1.04); box-shadow: 0 16px 38px rgba(15, 23, 42, 0.7); border-color: rgba(191, 219, 254, 0.7); }
  .pmodal__zoom-btn { position: absolute; top: 16px; left: 16px; width: 40px; height: 40px; border-radius: 999px; border: 0; background: rgba(15,23,42,0.88); color: #e5e7eb; font-size: 18px; font-weight: 500; cursor: pointer; display: grid; place-items: center; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.7); transition: all 0.2s ease; backdrop-filter: blur(8px); z-index: 2; pointer-events: auto; border: 1px solid rgba(147, 197, 253, 0.7); }
  .pmodal__zoom-btn:hover { background: rgba(30,64,175, 0.98); transform: translateY(-1px) scale(1.04); }
  .pmodal__thumbs { display: flex; gap: 10px; padding: 16px 18px 18px; overflow-x: auto; background: linear-gradient(to bottom, #020617, #020617 30%, #020617); min-height: 90px; align-items: center; border-top: 1px solid rgba(15, 23, 42, 0.85); }
  .pmodal__thumb { flex: 0 0 78px; height: 58px; border-radius: 14px; background: #020617; background-size: cover; background-position: center; border: 2px solid rgba(148, 163, 184, 0.4); cursor: pointer; transition: all 0.2s ease; opacity: 0.7; position: relative; overflow: hidden; }
  .pmodal__thumb::after { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at top, rgba(15, 23, 42, 0.25), transparent 60%); opacity: 0; transition: opacity 0.2s ease; }
  .pmodal__thumb:hover { opacity: 1; transform: translateY(-2px); }
  .pmodal__thumb:hover::after { opacity: 1; }
  .pmodal__thumb.is-active { border-color: #00347A; opacity: 1; transform: translateY(-2px); box-shadow: 0 8px 22px rgba(37, 99, 235, 0.6); }
  .pmodal__body { padding: 32px 28px 26px; display: flex; flex-direction: column; gap: 18px; overflow-y: auto; background: radial-gradient(circle at top left, rgba(0, 52, 122, 0.06), transparent 55%), #ffffff; position: relative; }
  .pmodal__body::before { content: ""; position: absolute; top: 0; left: 24px; right: 24px; height: 3px; border-radius: 999px; background: linear-gradient(90deg, #00347A, #ff4e1f, #00347A); opacity: 0.9; }
  .pmodal__title { margin: 4px 0 0; font-size: 26px; font-weight: 700; line-height: 1.2; color: #0f172a; letter-spacing: 0.01em; }
  .pmodal__desc { margin: 0; color: #64748b; line-height: 1.6; font-size: 15px; }
  .pmodal__price { font-size: 24px; font-weight: 700; color: #ff4e1f; margin: 6px 0 4px; }
  .pmodal__price::before { content: "Investimento"; display: block; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.16em; color: #94a3b8; margin-bottom: 2px; }
  .pmodal__details { display: flex; flex-direction: column; gap: 12px; }
  .pmodal__details-toggle { border: 1px solid rgba(15, 23, 42, 0.2); background: #ffffff; border-radius: 14px; padding: 12px 16px; display: inline-flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 15px; font-weight: 600; color: #0f172a; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08); }
  .pmodal__details-toggle:hover { border-color: rgba(0, 52, 122, 0.5); box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12); transform: translateY(-1px); }
  .pmodal__details-toggle:focus-visible { outline: 3px solid rgba(0, 52, 122, 0.6); outline-offset: 3px; }
  .pmodal__details-icon { width: 28px; height: 28px; border-radius: 999px; border: 1px solid rgba(15, 23, 42, 0.3); display: grid; place-items: center; font-size: 14px; font-weight: 700; color: #00347A; flex-shrink: 0; }
  .pmodal__details-label { display: inline-flex; align-items: center; gap: 12px; flex: 1; text-align: left; }
  .pmodal__details-arrow { font-size: 18px; color: #64748b; transition: transform 0.2s ease; }
  .pmodal__details-toggle[aria-expanded="true"] .pmodal__details-arrow { transform: rotate(90deg); color: #00347A; }
  .pmodal__details-content { border-radius: 14px; background: #f8fafc; padding: 16px; border: 1px solid rgba(148, 163, 184, 0.4); color: #475569; font-size: 14px; line-height: 1.65; }
  .pmodal__details-content p { margin: 0 0 12px; }
  .pmodal__details-content p:last-child { margin-bottom: 0; }
  .pmodal__details-content ul { margin: 0 0 12px 18px; padding: 0; }
  .pmodal__details-content h4 { margin: 14px 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #0f172a; }
  .pmodal__actions { margin-top: auto; display: flex; gap: 12px; flex-wrap: wrap; padding-top: 10px; border-top: 1px dashed rgba(148, 163, 184, 0.6); }
  .pmodal__actions .btn { flex: 1; min-width: 150px; padding: 14px 22px; border-radius: 999px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.22s ease; text-align: center; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 2px solid transparent; box-shadow: 0 10px 22px rgba(15, 23, 42, 0.12); }
  .pmodal__actions .add-cart { background: linear-gradient(135deg, #00347A, #004db8); color: #f9fafb; border-color: rgba(191, 219, 254, 0.6); }
  .pmodal__actions .add-cart:hover { background: linear-gradient(135deg, #004db8, #2563eb); transform: translateY(-2px); box-shadow: 0 14px 30px rgba(37, 99, 235, 0.45); }
  .pmodal__actions #pmodalWhats { background: #ffffff; color: #00347A; border-color: rgba(0, 52, 122, 0.75); }
  .pmodal__actions #pmodalWhats:hover { background: rgba(0, 52, 122, 0.04); color: #00347A; transform: translateY(-2px); box-shadow: 0 12px 26px rgba(148, 163, 184, 0.45); }
  .pmodal__actions .btn:focus-visible { outline: 3px solid rgba(0, 52, 122, 0.6); outline-offset: 3px; }
  @keyframes pmodalSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.95);} to { opacity: 1; transform: translateY(0) scale(1);} }
  @keyframes pmodalFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @media (max-width: 1024px) { .pmodal__dialog { grid-template-columns: 1fr; max-width: 720px; max-height: 85vh; } .pmodal__stage { aspect-ratio: 16/12; } .pmodal__media { border-right: 0; border-bottom: 1px solid rgba(30, 64, 175, 0.35); } .pmodal__body { padding: 26px 22px 22px; } }
  @media (max-width: 768px) { .pmodal.is-open { padding: 10px; } .pmodal__dialog { width: 100%; max-height: 95vh; border-radius: 18px; } .pmodal__title { font-size: 22px; } .pmodal__body { padding: 22px 18px 20px; gap: 14px; } .pmodal__actions { flex-direction: column; } .pmodal__actions .btn { flex: none; width: 100%; } .pmodal__close { top: 10px; right: 10px; } .pmodal__zoom-btn { top: 10px; left: 10px; } .pmodal__nav button { width: 42px; height: 42px; font-size: 22px; } .pmodal__thumbs { padding: 14px 14px 16px; min-height: 84px; } .pmodal__thumb { flex: 0 0 72px; height: 52px; } }
  @media (max-width: 480px) { .pmodal__title { font-size: 20px; } .pmodal__price { font-size: 20px; } .pmodal__actions .btn { padding: 13px 18px; font-size: 14px; } .pmodal__body::before { left: 18px; right: 18px; } }
  `;
    document.head.appendChild(style);
  }

  let modal = document.getElementById("productModal");
  if (!modal) {
    const tpl = document.createElement("div");
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
              <div class="pmodal__details">
                <button class="pmodal__details-toggle" type="button" id="pmodalDetailsToggle" aria-expanded="false" aria-controls="pmodalDetailsContent">
                  <span class="pmodal__details-label">
                    <span class="pmodal__details-icon" aria-hidden="true">i</span>
                    Descrição
                  </span>
                  <span class="pmodal__details-arrow" aria-hidden="true">›</span>
                </button>
                <div class="pmodal__details-content" id="pmodalDetailsContent" hidden></div>
              </div>
              <div class="pmodal__actions">
                <button class="btn add-cart" id="pmodalAddCart">Adicionar ao carrinho</button>
                <button class="btn" id="pmodalWhats">Quero este produto</button>
              </div>
            </div>
          </div>
          <div class="pmodal__backdrop"></div>
        </div>`;
    document.body.appendChild(tpl.firstElementChild);
    modal = document.getElementById("productModal");
  }

  return modal;
}

function initQuickView() {
  const modal = ensureQuickViewModal();
  if (!modal) return;

  const backdrop = modal.querySelector(".pmodal__backdrop");
  const btnClose = modal.querySelector(".pmodal__close");
  const titleEl = modal.querySelector("#pmodalTitle");
  const descEl = modal.querySelector("#pmodalDesc");
  const priceEl = modal.querySelector("#pmodalPrice");
  const stageEl = modal.querySelector("#pmodalStage");
  const thumbsEl = modal.querySelector("#pmodalThumbs");
  const prevBtn = modal.querySelector(".pmodal__prev");
  const nextBtn = modal.querySelector(".pmodal__next");
  const zoomBtn = modal.querySelector(".pmodal__zoom-btn");
  const addBtn = modal.querySelector("#pmodalAddCart");
  const whatsBtn = modal.querySelector("#pmodalWhats");
  const detailsToggle = modal.querySelector("#pmodalDetailsToggle");
  const detailsContent = modal.querySelector("#pmodalDetailsContent");

  let gallery = [];
  let idx = 0;

  let isZoomed = false;
  const zoomScale = 1.3;

  let panning = false;
  let startX = 0,
    startY = 0,
    scrollLeft = 0,
    scrollTop = 0;

  function lockScroll(lock) {
    document.documentElement.style.overflow = lock ? "hidden" : "";
  }

  function formatPrice(price) {
    if (!price || price === 0) return "Preço sob consulta";
    return moneyBRL(price);
  }

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDetailsHtml(text) {
    if (!text) return "";

    const blocks = String(text)
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);

    return blocks
      .map((block) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        if (!lines.length) return "";

        if (lines[0].startsWith("## ")) {
          return `<h4>${escapeHTML(lines[0].replace(/^##\s*/, ""))}</h4>`;
        }

        const isList = lines.every((line) => line.startsWith("- ") || line.startsWith("• "));
        if (isList) {
          const items = lines
            .map((line) => line.replace(/^[-•]\s*/, ""))
            .map((line) => `<li>${escapeHTML(line)}</li>`)
            .join("");
          return `<ul>${items}</ul>`;
        }

        const paragraph = escapeHTML(block).replace(/\n/g, "<br>");
        return `<p>${paragraph}</p>`;
      })
      .join("");
  }

  function getCardPrimaryImage(card) {
    const imgNode = card.querySelector(".p-card__img") || card.querySelector(".card__img");
    if (!imgNode) return "";

    let url = imgNode.getAttribute("data-full") || "";
    if (!url && imgNode.style?.backgroundImage) {
      const m = imgNode.style.backgroundImage.match(/url\(["']?(.*?)["']?\)/);
      if (m && m[1]) url = m[1];
    }
    return url;
  }

  function getCardPrice(card) {
    const priceAttr = card.getAttribute("data-price-num");
    const priceSpan = card.querySelector("[data-price]");
    let price = 0;

    if (priceAttr) {
      price = Number(priceAttr);
    } else if (priceSpan && priceSpan.textContent && priceSpan.textContent !== "Consultar") {
      const raw = priceSpan.textContent
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "");
      price = Number(raw || 0);
    }
    return price;
  }

  function resetZoom() {
    const activeSlide = stageEl.querySelector(".pmodal__slide.is-active");
    if (activeSlide) {
      activeSlide.classList.remove("is-zoomed");
      activeSlide.style.transform = "scale(1)";
      activeSlide.style.cursor = "zoom-in";
    }
    stageEl.classList.remove("is-zoomed");
    zoomBtn.textContent = "🔍";
    zoomBtn.setAttribute("aria-label", "Ampliar imagem");
    zoomBtn.setAttribute("title", "Ampliar imagem");
    isZoomed = false;
    panning = false;

    stageEl.scrollLeft = 0;
    stageEl.scrollTop = 0;

    prevBtn.style.pointerEvents = "auto";
    nextBtn.style.pointerEvents = "auto";
    prevBtn.style.opacity = "1";
    nextBtn.style.opacity = "1";
  }

  function updateActive() {
    const slides = stageEl.querySelectorAll(".pmodal__slide");
    const thumbs = thumbsEl.querySelectorAll(".pmodal__thumb");
    slides.forEach((s, i) => s.classList.toggle("is-active", i === idx));
    thumbs.forEach((t, i) => t.classList.toggle("is-active", i === idx));
  }

  function goTo(i) {
    idx = (i + gallery.length) % gallery.length;
    updateActive();
    resetZoom();
  }

  function next() {
    goTo(idx + 1);
  }

  function prev() {
    goTo(idx - 1);
  }

  function buildCarousel(urls) {
    stageEl.innerHTML = "";
    thumbsEl.innerHTML = "";
    gallery = urls.filter(Boolean);
    idx = 0;

    if (!gallery.length) return;

    gallery.forEach((src, i) => {
      const slide = document.createElement("div");
      slide.className = "pmodal__slide" + (i === 0 ? " is-active" : "");
      slide.style.backgroundImage = `url('${src}')`;
      stageEl.appendChild(slide);

      const th = document.createElement("button");
      th.type = "button";
      th.className = "pmodal__thumb" + (i === 0 ? " is-active" : "");
      th.style.backgroundImage = `url('${src}')`;
      th.addEventListener("click", () => goTo(i));
      thumbsEl.appendChild(th);
    });

    resetZoom();
  }

  function toggleZoom() {
    const activeSlide = stageEl.querySelector(".pmodal__slide.is-active");
    if (!activeSlide) return;

    if (!isZoomed) {
      stageEl.classList.add("is-zoomed");
      activeSlide.classList.add("is-zoomed");
      activeSlide.style.transform = `scale(${zoomScale})`;
      activeSlide.style.cursor = "grab";

      zoomBtn.textContent = "✕";
      zoomBtn.setAttribute("aria-label", "Reduzir imagem");
      zoomBtn.setAttribute("title", "Reduzir imagem");
      isZoomed = true;

      prevBtn.style.pointerEvents = "none";
      nextBtn.style.pointerEvents = "none";
      prevBtn.style.opacity = "0.5";
      nextBtn.style.opacity = "0.5";
    } else {
      resetZoom();
    }
  }

  function onPanStart(e) {
    if (!isZoomed) return;

    panning = true;
    const slide = stageEl.querySelector(".pmodal__slide.is-active");
    if (slide) slide.style.cursor = "grabbing";

    const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

    startX = clientX;
    startY = clientY;
    scrollLeft = stageEl.scrollLeft;
    scrollTop = stageEl.scrollTop;

    if (e.cancelable) e.preventDefault();
  }

  function onPanMove(e) {
    if (!panning) return;

    const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    stageEl.scrollLeft = scrollLeft - dx;
    stageEl.scrollTop = scrollTop - dy;

    if (e.cancelable) e.preventDefault();
  }

  function onPanEnd() {
    panning = false;
    const slide = stageEl.querySelector(".pmodal__slide.is-active");
    if (slide && isZoomed) slide.style.cursor = "grab";
  }

  let x0 = null;
  let y0 = null;

  function onTouchStart(e) {
    if (isZoomed) return;
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (isZoomed || x0 == null) return;

    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      dx > 0 ? prev() : next();
    }
    x0 = null;
    y0 = null;
  }

  function openWithCard(card) {
    const title = card.querySelector("h4")?.textContent?.trim() || "Produto Luna";
    const key = getCardKey(card);

    // ✅ NÃO exibir texto acima do accordion (onde ficava grifado em azul)
    // Mantém o elemento, mas vazio e escondido.
    descEl.textContent = "";
    descEl.style.display = "none";

    // ✅ Conteúdo do accordion "Descrição":
    // Preferência: data-details -> data-desc (cache) -> vazio
    const details =
      __DETAILS_MAP__.get(key) ||
      __DESC_MAP__.get(key) ||
      card.getAttribute("data-details") ||
      card.getAttribute("data-desc") ||
      "";

    const galleryAttr = (card.getAttribute("data-gallery") || "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);

    const primary = getCardPrimaryImage(card);
    const imgs = galleryAttr.length ? galleryAttr : primary ? [primary] : [];

    const price = getCardPrice(card);

    titleEl.textContent = title;
    priceEl.textContent = formatPrice(price);

    buildCarousel(imgs);

    if (detailsContent && detailsToggle) {
      detailsContent.innerHTML = formatDetailsHtml(details);
      const hasDetails = Boolean(detailsContent.innerHTML.trim());

      detailsContent.hidden = true;
      detailsToggle.setAttribute("aria-expanded", "false");

      // se não tiver detalhes, some o botão "Descrição"
      detailsToggle.hidden = !hasDetails;
    }

    addBtn.onclick = () => {
      const id =
        card.getAttribute("data-sku") ||
        title.toLowerCase().replace(/\s+/g, "-").slice(0, 60);

      const img = imgs[0] || primary || "";
      if (typeof window.addToCart === "function") {
        window.addToCart({ id, title, price, img });
      } else {
        pushToast(`“${title}” adicionado ao carrinho`);
      }
      close();
    };

    whatsBtn.onclick = () => {
      const msg = encodeURIComponent(
        `Olá, vim do site e me interessei por: ${title}. Poderiam enviar mais detalhes?`
      );
      const zapUrl = getNextWhatsAppUrl(msg);
      if (!zapUrl) return;
      const w = window.open(zapUrl, "_blank");
      if (w && w.opener) w.opener = null;
    };

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    lockScroll(true);
    resetZoom();
    setTimeout(() => btnClose.focus(), 10);
  }

  function close() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    lockScroll(false);
    stageEl.innerHTML = "";
    thumbsEl.innerHTML = "";
    gallery = [];
    idx = 0;
    resetZoom();

    // volta o comportamento padrão do desc
    descEl.style.display = "";
  }

  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  zoomBtn.addEventListener("click", toggleZoom);

  if (detailsToggle && detailsContent) {
    detailsToggle.addEventListener("click", () => {
      const isExpanded = detailsToggle.getAttribute("aria-expanded") === "true";
      detailsToggle.setAttribute("aria-expanded", String(!isExpanded));
      detailsContent.hidden = isExpanded;
    });
  }

  btnClose.addEventListener("click", close);
  backdrop.addEventListener("click", close);

  stageEl.addEventListener("mousedown", onPanStart);
  document.addEventListener("mousemove", onPanMove);
  document.addEventListener("mouseup", onPanEnd);

  stageEl.addEventListener("touchstart", (e) => {
    if (isZoomed) {
      onPanStart(e); // pan
    } else {
      onTouchStart(e); // swipe
    }
  }, { passive: false });

  document.addEventListener("touchmove", (e) => {
    if (isZoomed) onPanMove(e);
  }, { passive: false });

  document.addEventListener("touchend", (e) => {
    if (isZoomed) onPanEnd(e);
    else onTouchEnd(e);
  });


  stageEl.addEventListener("dblclick", (e) => {
    if (e.target.classList.contains("pmodal__slide")) toggleZoom();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!modal.classList.contains("is-open")) return;

    if (isZoomed) resetZoom();
    else close();
  });

  document.addEventListener("click", (e) => {
    const viaBtn = e.target.closest("[data-quickview]");
    const viaImg = e.target.closest(".card__img, .p-card__img");
    const trigger = viaBtn || viaImg;
    if (!trigger) return;

    const card = trigger.closest(".card");
    if (!card) return;

    if (e.target.closest('[data-add="cart"]') || e.target.closest('[data-cta="whats"]')) return;

    e.preventDefault();
    openWithCard(card);
  });
}

/* ===========================
  BOOT
=========================== */
document.addEventListener("DOMContentLoaded", () => {
  initYearFooter();
  initSmoothAnchors();
  initStickyShadow();
  cacheAndHideDescriptions();
  initHoverGallery();
  initPromoRotation();
  initWhatsAppCTA();
  initFloatingWhatsApp();
  initHeroCarousel();
  initHeaderSearch();
  initAllFilters();
  initCart();
  initQuickView();            // ✅ depois
  initProductSwitcher();
});


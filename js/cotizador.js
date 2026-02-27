// js/cotizador.js
// Cotizador inteligente Renacer Boutique (carrito → total → WhatsApp)

const CONFIG = {
  brandName: "Renacer Boutique",
  whatsappNumber: "51956327144", // cambia si es otro
  cartKey: "rb_cart_v2",            // 🔁 CAMBIA si tu carrito usa otra key
  currency: "PEN",

  // delivery por zona (puedes ajustar)
  shipping: {
    Huamanga: 6,
    "Carmen Alto": 5,
    "San Juan Bautista": 7,
    "Nazarenas": 10,
    "Andres Avelino Caceres": 10,
    "Mollepata": 10,
    Otro: 10
  },

  // cupones “inteligentes”
  // type: "percent" | "fixed"
  coupons: {
    DESCUENTO10: { type: "percent", value: 10, minSubtotal: 50 }, // 10% desde S/50
    ENVIO0:    { type: "fixed", value: 9999, minSubtotal: 0, freeShipping: true }, // activa delivery gratis
  }
};

const $ = (id) => document.getElementById(id);

function money(n) {
  const v = Number(n || 0);
  return `S/ ${v.toFixed(2)}`;
}

function waLink(text) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function setYear() {
  const y = $("year");
  if (y) y.textContent = new Date().getFullYear();
}

function readCart() {
  try {
    const raw = localStorage.getItem(CONFIG.cartKey);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CONFIG.cartKey, JSON.stringify(items || []));
}

function cartCount(items) {
  return (items || []).reduce((a, it) => a + Number(it.qty || 1), 0);
}

function subtotal(items) {
  return (items || []).reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.qty || 1)), 0);
}

/**
 * Esperado por item (flexible):
 * { sku, name, price, qty, size?, category? }
 */
function normalizeItem(it) {
  return {
    sku: String(it.sku || it.id || "").trim(),
    name: String(it.name || "").trim(),
    price: Number(it.price || 0),
    qty: Number(it.qty || 1),
    size: it.size ? String(it.size) : "",
  };
}

function renderItems(items) {
  const wrap = $("items");
  const hint = $("cartHint");
  if (!wrap) return;

  if (!items.length) {
    wrap.innerHTML = "";
    if (hint) hint.textContent = "Tu carrito está vacío. Ve al catálogo para agregar productos.";
    return;
  }

  if (hint) hint.textContent = "Revisa tu pedido. Puedes ajustar cantidades.";

  wrap.innerHTML = items.map((raw, idx) => {
    const it = normalizeItem(raw);
    return `
      <div class="qItem">
        <div class="qItem__main">
          <div class="qItem__top">
            <strong>${it.name || "(Sin nombre)"}</strong>
            <span class="pill pill--soft">${it.sku || "SIN-SKU"}</span>
          </div>
          <div class="qItem__meta muted">
            ${it.size ? `Talla: ${it.size} • ` : ""}Precio: ${money(it.price)}
          </div>
        </div>

        <div class="qItem__right">
          <div class="qty">
            <button class="icon-btn" type="button" data-dec="${idx}" aria-label="Disminuir">−</button>
            <input class="input qty__in" type="number" min="1" value="${it.qty}" data-qty="${idx}" />
            <button class="icon-btn" type="button" data-inc="${idx}" aria-label="Aumentar">+</button>
          </div>
          <div class="qItem__sum"><strong>${money(it.price * it.qty)}</strong></div>
          <button class="btn btn--ghost btn--small" type="button" data-rm="${idx}">Quitar</button>
        </div>
      </div>
    `;
  }).join("");

  // handlers
  wrap.querySelectorAll("[data-inc]").forEach(btn => {
    btn.addEventListener("click", () => changeQty(Number(btn.dataset.inc), +1));
  });
  wrap.querySelectorAll("[data-dec]").forEach(btn => {
    btn.addEventListener("click", () => changeQty(Number(btn.dataset.dec), -1));
  });
  wrap.querySelectorAll("[data-rm]").forEach(btn => {
    btn.addEventListener("click", () => removeItem(Number(btn.dataset.rm)));
  });
  wrap.querySelectorAll("[data-qty]").forEach(inp => {
    inp.addEventListener("change", () => setQty(Number(inp.dataset.qty), Number(inp.value)));
  });
}

let STATE = {
  items: [],
  coupon: null,        // { code, ... }
  freeShipping: false,
  discount: 0,
  shipping: 0,
  total: 0,
};

function getMode() { return $("q_mode")?.value || "delivery"; }
function getZone() { return $("q_zone")?.value || "Huamanga"; }

function calcShipping() {
  if (getMode() === "recojo") return 0;
  if (STATE.freeShipping) return 0;
  return Number(CONFIG.shipping[getZone()] ?? 0);
}

function applyCoupon(codeRaw) {
  const code = (codeRaw || "").trim().toUpperCase();
  const st = $("couponStatus");

  STATE.coupon = null;
  STATE.freeShipping = false;

  if (!code) {
    if (st) st.textContent = "";
    recalc();
    return;
  }

  const c = CONFIG.coupons[code];
  if (!c) {
    if (st) st.textContent = "Cupón inválido.";
    recalc();
    return;
  }

  const sub = subtotal(STATE.items);
  if (sub < Number(c.minSubtotal || 0)) {
    if (st) st.textContent = `Cupón válido desde ${money(c.minSubtotal)}.`;
    recalc();
    return;
  }

  STATE.coupon = { code, ...c };
  STATE.freeShipping = !!c.freeShipping;

  if (st) st.textContent = `Cupón aplicado: ${code} ✅`;
  recalc();
}

function calcDiscount(sub) {
  if (!STATE.coupon) return 0;
  const c = STATE.coupon;

  if (c.type === "percent") {
    return +(sub * (Number(c.value || 0) / 100)).toFixed(2);
  }
  if (c.type === "fixed") {
    return Math.min(sub, Number(c.value || 0));
  }
  return 0;
}

function recalc() {
  const sub = subtotal(STATE.items);
  const disc = calcDiscount(sub);
  const ship = calcShipping();

  const total = Math.max(0, sub - disc + ship);

  STATE.discount = disc;
  STATE.shipping = ship;
  STATE.total = total;

  $("t_sub").textContent = money(sub);
  $("t_disc").textContent = `- ${money(disc).replace("S/ ", "S/ ")}`;
  $("t_ship").textContent = money(ship);
  $("t_total").textContent = money(total);

  // header cart count
  const cc = $("cartCount");
  if (cc) cc.textContent = String(cartCount(STATE.items));
}

function changeQty(index, delta) {
  const items = [...STATE.items];
  const it = items[index];
  if (!it) return;
  const q = Math.max(1, Number(it.qty || 1) + delta);
  it.qty = q;
  STATE.items = items;
  writeCart(items);
  renderItems(items);
  recalc();
}

function setQty(index, value) {
  const items = [...STATE.items];
  const it = items[index];
  if (!it) return;
  const q = Math.max(1, Number(value || 1));
  it.qty = q;
  STATE.items = items;
  writeCart(items);
  renderItems(items);
  recalc();
}

function removeItem(index) {
  const items = [...STATE.items];
  items.splice(index, 1);
  STATE.items = items;
  writeCart(items);
  renderItems(items);
  recalc();
}

function clearCart() {
  STATE.items = [];
  writeCart([]);
  renderItems([]);
  recalc();
}

function buildWhatsAppMessage() {
  const name = ($("q_name")?.value || "").trim();
  const mode = getMode();
  const zone = getZone();
  const ref = ($("q_ref")?.value || "").trim();

  const sub = subtotal(STATE.items);
  const lines = [];

  lines.push(`Hola ${CONFIG.brandName} 👋`);
  if (name) lines.push(`Mi nombre: ${name}`);
  lines.push("");
  lines.push("🧾 *Cotización de pedido*");
  lines.push("");

  if (!STATE.items.length) {
    lines.push("No tengo productos en el carrito aún.");
  } else {
    STATE.items.forEach((raw, i) => {
      const it = normalizeItem(raw);
      const line = `• ${it.sku} — ${it.name} x${it.qty} = ${money(it.price * it.qty)}`;
      lines.push(line);
    });
  }

  lines.push("");
  lines.push(`Subtotal: ${money(sub)}`);
  if (STATE.discount > 0) lines.push(`Descuento: -${money(STATE.discount)}`);
  lines.push(`Delivery: ${money(STATE.shipping)}`);
  lines.push(`*Total: ${money(STATE.total)}*`);
  lines.push("");

  lines.push("📦 *Entrega*");
  lines.push(`Tipo: ${mode === "recojo" ? "Recojo" : "Delivery"}`);
  if (mode !== "recojo") lines.push(`Zona (referencial): ${zone}`);
  if (ref) lines.push(`Referencia: ${ref}`);

  if (STATE.coupon?.code) {
    lines.push("");
    lines.push(`Cupón aplicado: ${STATE.coupon.code}`);
  }

  lines.push("");
  lines.push("¿Me confirmas disponibilidad y cómo coordinamos? ✅");

  return lines.join("\n");
}

function initButtons() {
  // WhatsApp rápidos
  const defaultMsg = `Hola ${CONFIG.brandName} 👋 Quiero hacer una consulta, ¿me ayudas?`;
  const header = $("btnWhatsappHeader");
  const float = $("waFloat");
  if (header) header.href = waLink(defaultMsg);
  if (float) float.href = waLink(defaultMsg);

  // vaciar
  $("btnClear")?.addEventListener("click", () => {
    clearCart();
    $("quoteStatus").textContent = "Carrito vacío.";
  });

  // coupon
  $("btnApplyCoupon")?.addEventListener("click", () => applyCoupon($("q_coupon")?.value));

  // recalc on mode/zone changes
  $("q_mode")?.addEventListener("change", recalc);
  $("q_zone")?.addEventListener("change", recalc);

  // enviar cotización
  $("btnWhatsAppQuote")?.addEventListener("click", () => {
    const st = $("quoteStatus");
    if (!STATE.items.length) {
      if (st) st.textContent = "Tu carrito está vacío.";
      return;
    }
    if (st) st.textContent = "Abriendo WhatsApp…";
    window.open(waLink(buildWhatsAppMessage()), "_blank", "noopener,noreferrer");
  });

  // autocoupon enter
  $("q_coupon")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyCoupon($("q_coupon")?.value);
    }
  });
}

(function start() {
  setYear();
  STATE.items = readCart();
  renderItems(STATE.items);
  initButtons();
  recalc();
})();
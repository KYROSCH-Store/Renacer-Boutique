import { supabase } from "./supabaseClient.js";
import { getCart, removeSku, clearCart } from "./store.js";
import { initCartCount, initDrawer, initWhatsAppButtons, initYear, waLink } from "./ui.js";

initYear();
initDrawer();
initCartCount();
initWhatsAppButtons(`Hola Renacer Boutique 👋. Quiero comprar, ¿me ayudas?`);

const listEl = document.getElementById("cartList");
const emptyEl = document.getElementById("empty");
const totalEl = document.getElementById("total");
const sendBtn = document.getElementById("sendWA");
const clearBtn = document.getElementById("clearCart");

function money(n){
  const v = Number(n || 0);
  return `S/ ${v.toFixed(0)}`;
}

function buildMessage(items){
  // Solo IDs + estructura pro
  const lines = items.map(it => `• ${it.sku} x${it.qty} — ${it.name} (${money(it.price)})`);
  const total = items.reduce((acc, it)=> acc + Number(it.price||0)*Number(it.qty||1), 0);

  return [
    "Hola Renacer Boutique 👋",
    `Quiero pedir estas prendas:`,
    "",
    ...lines,
    "",
    `Total estimado: ${money(total)}`,
    "¿Me confirmas stock y delivery?"
  ].join("\n");
}

async function fetchProductsBySkus(skus){
  const { data, error } = await supabase
    .from("products")
    .select("sku,name,price,stock")
    .in("sku", skus);

  if(error) throw error;
  return data || [];
}

async function render(){
  const cart = getCart();

  if(!cart.length){
    emptyEl.style.display = "block";
    listEl.innerHTML = "";
    totalEl.textContent = "S/ 0";
    return;
  }

  emptyEl.style.display = "none";

  const skus = cart.map(x => x.sku);
  let dbProducts = [];
  try{
    dbProducts = await fetchProductsBySkus(skus);
  }catch(e){
    console.error(e);
    listEl.innerHTML = `<p class="muted">Error cargando productos del carrito. Revisa Supabase.</p>`;
    return;
  }

  // merge db + cart qty
  const merged = cart.map(c=>{
    const p = dbProducts.find(d=>d.sku === c.sku);
    return {
      sku: c.sku,
      qty: c.qty || 1,
      name: p?.name || "Producto",
      price: p?.price || 0,
      stock: p?.stock ?? 0
    };
  });

  const total = merged.reduce((acc, it)=> acc + Number(it.price||0)*Number(it.qty||1), 0);
  totalEl.textContent = money(total);

  listEl.innerHTML = merged.map(it=>`
    <div class="contactBox" style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
      <div>
        <strong>${it.sku}</strong> — ${it.name}<br/>
        <span class="muted">Cantidad: ${it.qty} • ${money(it.price)} • Stock: ${it.stock}</span>
      </div>
      <button class="btn btn--ghost" type="button" data-remove="${it.sku}">Quitar</button>
    </div>
  `).join("");

  listEl.querySelectorAll("[data-remove]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const sku = btn.getAttribute("data-remove");
      removeSku(sku);
      initCartCount();
      render();
    });
  });

  // WhatsApp checkout
  sendBtn.onclick = ()=>{
    const msg = buildMessage(merged);
    window.open(waLink(msg), "_blank", "noopener");
  };
}

clearBtn?.addEventListener("click", ()=>{
  clearCart();
  initCartCount();
  render();
});

render();
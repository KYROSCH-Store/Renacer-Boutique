import { supabase } from "./supabaseClient.js";
import { LOCALE } from "./config.js";
import { addSku } from "./store.js";
import { initCartCount, initDrawer, initWhatsAppButtons, initYear, waLink } from "./ui.js";

initYear();
initDrawer();
initCartCount();
initWhatsAppButtons(`Hola Renacer Boutique 👋 Soy de ${LOCALE}. Quiero comprar, ¿me ayudas?`);

const productsEl = document.getElementById("products");
const emptyEl = document.getElementById("empty");
const qEl = document.getElementById("q");
const catEl = document.getElementById("cat");

let allProducts = [];

function money(n){
  const v = Number(n || 0);
  return `S/ ${v.toFixed(0)}`;
}

function card(p){
  const img = p.image_url || "img/placeholder.jpg";
  const meta = `${p.size || "—"} • Estado ${p.condition || "—"} • Stock ${p.stock ?? 1}`;
  return `
  <article class="product reveal" data-cat="${p.category}">
    <a class="product__img" href="#" aria-label="Ver producto ${p.sku}">
      <img src="${img}" alt="${p.name} - Renacer Boutique Ayacucho" loading="lazy" />
      <span class="tag">${p.sku}</span>
    </a>

    <div class="product__body">
      <div class="product__top">
        <h3>${p.name}</h3>
        <span class="price">${money(p.price)}</span>
      </div>

      <p class="meta">${meta}</p>

      <div class="product__actions">
        <button class="btn btn--small btn--brand" type="button" data-add="${p.sku}">
          Agregar al carrito
        </button>

        <a class="btn btn--small btn--ghost" href="${waLink(`Hola Renacer Boutique 👋 Quiero la prenda ${p.sku} (${p.name}), ${money(p.price)}. ¿Sigue disponible?`)}" rel="noopener" target="_blank">
          WhatsApp
        </a>

        <button class="btn btn--small btn--ghost" type="button" data-copy="${p.sku}">Copiar ID</button>
      </div>
    </div>
  </article>`;
}

function render(list){
  productsEl.innerHTML = list.map(card).join("");
  emptyEl.style.display = list.length ? "none" : "block";

  // add to cart
  productsEl.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const sku = btn.getAttribute("data-add");
      addSku(sku);
      initCartCount();
      const old = btn.textContent;
      btn.textContent = "Agregado ✅";
      btn.disabled = true;
      setTimeout(()=>{ btn.textContent = old; btn.disabled = false; }, 900);
    });
  });

  // copy sku
  productsEl.querySelectorAll("[data-copy]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const sku = btn.getAttribute("data-copy");
      try{
        await navigator.clipboard.writeText(sku);
        const old = btn.textContent;
        btn.textContent = "¡Copiado!";
        btn.disabled = true;
        setTimeout(()=>{ btn.textContent = old; btn.disabled = false; }, 1000);
      }catch{
        alert("Copia manual: " + sku);
      }
    });
  });
}

function applyFilters(){
  const q = (qEl.value || "").toLowerCase().trim();
  const cat = catEl.value;

  let list = [...allProducts];

  if(cat !== "all") list = list.filter(p => (p.category || "").toLowerCase() === cat);

  if(q){
    list = list.filter(p=>{
      const s = `${p.sku} ${p.name} ${p.category} ${p.size} ${p.description}`.toLowerCase();
      return s.includes(q);
    });
  }

  render(list);
}

async function load(){
  const { data, error } = await supabase
    .from("products")
    .select("sku,name,price,category,size,condition,stock,image_url,description,created_at")
    .order("created_at", { ascending: false });

  if(error){
    console.error(error);
    productsEl.innerHTML = `<p class="muted">Error cargando catálogo. Revisa Supabase keys.</p>`;
    return;
  }

  allProducts = data || [];
  applyFilters();
}

qEl?.addEventListener("input", applyFilters);
catEl?.addEventListener("change", applyFilters);

load();
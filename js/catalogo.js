import { supabase } from "./supabaseClient.js";
import { WHATSAPP_NUMBER} from "./config.js";
import { addSku, cartCount } from "./store.js";

/* =========================
   DOM
========================= */
const productsEl = document.getElementById("products");
const emptyEl = document.getElementById("empty");
const qEl = document.getElementById("q");
const catEl = document.getElementById("cat");
const statusBox = document.getElementById("statusBox");

/* =========================
   UI Helpers (sin depender de script.js)
========================= */
function setYear(){
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

function waLink(text){
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

function setWhatsAppDefault(){
  const msg = `Hola Renacer Boutique. Quiero comprar, ¿me ayudas?`;
  const ids = ["btnWhatsappHeader","btnWhatsappDrawer","waFloat"];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.href = waLink(msg);
  });
}

function setCartCount(){
  const el = document.getElementById("cartCount");
  if (el) el.textContent = String(cartCount());
}

function drawerInit(){
  const burger = document.getElementById("burger");
  const drawer = document.getElementById("drawer");
  const closeBtn = document.getElementById("drawerClose");

  function open(){
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden","false");
    burger.setAttribute("aria-expanded","true");
    document.body.style.overflow = "hidden";
  }
  function close(){
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden","true");
    burger.setAttribute("aria-expanded","false");
    document.body.style.overflow = "";
  }

  burger?.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  drawer?.addEventListener("click", (e)=>{ if(e.target === drawer) close(); });
}

function showStatus(html){
  statusBox.style.display = "block";
  statusBox.innerHTML = html;
}

function hideStatus(){
  statusBox.style.display = "none";
  statusBox.innerHTML = "";
}

/* =========================
   Data + Render
========================= */
let all = [];

function money(n){
  const v = Number(n || 0);
  return `S/ ${Math.round(v)}`;
}

function esc(s){
  return (s ?? "").toString().replace(/[&<>"']/g, m => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[m]));
}

function card(p){
  const sku = esc(p.sku);
  const name = esc(p.name);
  const cat = esc(p.category || "unisex");
  const price = Number(p.price || 0);
  const stock = Number.isFinite(Number(p.stock)) ? Number(p.stock) : 1;

  const size = p.size ? `Talla ${esc(p.size)}` : "Talla —";
  const cond = p.condition ? `Estado ${esc(p.condition)}` : "Estado —";

  const img = p.image_url ? esc(p.image_url) : "img/placeholder.jpg";
  const meta = `${size} • ${cond} • Stock ${stock}`;

  const disabled = stock <= 0 ? "disabled" : "";

  const msg = [
    "Hola Renacer Boutique 👋",
    `Quiero la prenda ${sku} (${name})`,
    `Precio: ${money(price)}`,
    "¿Sigue disponible?"
  ].join("\n");

  return `
  <article class="product" data-cat="${cat}" data-sku="${sku}" style="opacity:1; visibility:visible;">
    <a class="product__img" href="#" aria-label="Ver producto ${sku}">
      <img src="${img}" alt="${name} - Renacer Boutique Ayacucho" loading="lazy" />
      <span class="tag">${sku}</span>
      ${stock <= 0 ? `<span class="tag" style="left:auto; right:12px;">Agotado</span>` : ``}
    </a>

    <div class="product__body">
      <div class="product__top">
        <h3>${name}</h3>
        <span class="price">${money(price)}</span>
      </div>
      <p class="meta">${meta}</p>

      <div class="product__actions">
        <button class="btn btn--small btn--brand" type="button" data-add="${sku}" ${disabled}>
          ${stock <= 0 ? "Agotado" : "Agregar al carrito"}
        </button>

        <a class="btn btn--small btn--ghost" href="${waLink(msg)}" target="_blank" rel="noopener">
          WhatsApp
        </a>

        <button class="btn btn--small btn--ghost" type="button" data-copy="${sku}">
          Copiar ID
        </button>
      </div>
    </div>
  </article>`;
}

function bind(){
  // Add to cart
  productsEl.querySelectorAll("[data-add]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const sku = btn.getAttribute("data-add");
      if(!sku) return;

      addSku(sku);
      setCartCount();

      const old = btn.textContent;
      btn.textContent = "Agregado ✅";
      btn.disabled = true;
      setTimeout(()=>{ btn.textContent = old; btn.disabled = false; }, 900);
    });
  });

  // Copy ID
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
  const q = (qEl?.value || "").toLowerCase().trim();
  const cat = (catEl?.value || "all").toLowerCase();

  let list = [...all];

  if(cat !== "all"){
    list = list.filter(p => (p.category || "").toLowerCase() === cat);
  }

  if(q){
    list = list.filter(p=>{
      const blob = `${p.sku} ${p.name} ${p.category} ${p.size} ${p.description}`.toLowerCase();
      return blob.includes(q);
    });
  }

  if(!list.length){
    productsEl.innerHTML = "";
    emptyEl.style.display = "block";
    return;
  }

  emptyEl.style.display = "none";
  productsEl.innerHTML = list.map(card).join("");

  // Hard-fix anti transparencia (por si tu CSS afecta .product)
  productsEl.querySelectorAll(".product").forEach(el=>{
    el.style.setProperty("opacity","1","important");
    el.style.setProperty("visibility","visible","important");
    el.style.setProperty("transform","none","important");
    el.style.setProperty("filter","none","important");
  });

  bind();
}

qEl?.addEventListener("input", applyFilters);
catEl?.addEventListener("change", applyFilters);

/* =========================
   Load
========================= */
async function load(){
  hideStatus();
  productsEl.innerHTML = `<p class="muted">Cargando catálogo…</p>`;
  emptyEl.style.display = "none";

  const { data, error } = await supabase
    .from("products")
    .select("sku,name,price,category,size,condition,stock,image_url,description,created_at")
    .order("created_at", { ascending: false });

  if(error){
    console.error(error);
    showStatus(`
      <h3>Error de conexión</h3>
      <p class="muted">${esc(error.message || "Error desconocido")}</p>
      <p class="tiny muted">Revisa: Project URL + Publishable key, RLS policies (select anon).</p>
    `);
    productsEl.innerHTML = "";
    return;
  }

  all = data || [];

  if(!all.length){
    productsEl.innerHTML = "";
    emptyEl.style.display = "block";
    return;
  }

  applyFilters();
}

/* =========================
   Start
========================= */
setYear();
drawerInit();
setWhatsAppDefault();
setCartCount();
load();
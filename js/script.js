/* =========================
   CONFIG WHATSAPP
========================= */
const WHATSAPP_NUMBER = "51999999999"; // <-- cambia esto
const MSG_GENERAL = "Hola Renacer Boutique 👋 quiero comprar. ¿Me ayudas?";

function waLink(texto){
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}

/* Links generales WhatsApp */
["btnWhatsappHeader","btnWhatsappHero","btnWhatsappDrawer","btnWhatsappFinal","waFloat"].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.href = waLink(MSG_GENERAL);
});

/* Botones WhatsApp por producto (data-wa) */
document.querySelectorAll("[data-wa]").forEach(a=>{
  a.addEventListener("click", e=>{
    e.preventDefault();
    const msg = a.getAttribute("data-wa") || MSG_GENERAL;
    window.open(waLink(msg), "_blank", "noopener");
  });
});

/* =========================
   CARRITO (localStorage)
   Guarda: sku, qty
========================= */
const CART_KEY = "rb_cart_v1";

function getCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { return []; }
}

function setCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount(){
  const el = document.getElementById("cartCount");
  if(!el) return;
  const cart = getCart();
  const count = cart.reduce((acc, it) => acc + (it.qty || 1), 0);
  el.textContent = String(count);
}

function addToCart({ sku }){
  const cart = getCart();
  const found = cart.find(x => x.sku === sku);
  if(found) found.qty += 1;
  else cart.push({ sku, qty: 1 });
  setCart(cart);
}

/* Botón Agregar al carrito */
document.querySelectorAll("[data-add]").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const sku = btn.getAttribute("data-sku");
    if(!sku) return;

    addToCart({ sku });

    const old = btn.textContent;
    btn.textContent = "Agregado ✅";
    btn.disabled = true;
    setTimeout(()=>{
      btn.textContent = old;
      btn.disabled = false;
    }, 900);
  });
});

/* Inicializa contador al cargar */
updateCartCount();

/* =========================
   COPIAR ID
========================= */
document.querySelectorAll("[data-copy]").forEach(btn=>{
  btn.addEventListener("click", async ()=>{
    const id = btn.getAttribute("data-copy");
    if(!id) return;

    try{
      await navigator.clipboard.writeText(id);
      const old = btn.textContent;
      btn.textContent = "¡Copiado!";
      btn.disabled = true;
      setTimeout(()=>{
        btn.textContent = old || "Copiar ID";
        btn.disabled = false;
      }, 1100);
    }catch{
      alert("No se pudo copiar. Copia manual: " + id);
    }
  });
});

/* =========================
   MOBILE DRAWER
========================= */
const burger = document.getElementById("burger");
const drawer = document.getElementById("drawer");
const drawerClose = document.getElementById("drawerClose");

function openDrawer(){
  if(!drawer || !burger) return;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden","false");
  burger.setAttribute("aria-expanded","true");
  document.body.style.overflow = "hidden";
}
function closeDrawer(){
  if(!drawer || !burger) return;
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden","true");
  burger.setAttribute("aria-expanded","false");
  document.body.style.overflow = "";
}

burger?.addEventListener("click", openDrawer);
drawerClose?.addEventListener("click", closeDrawer);

drawer?.addEventListener("click", (e)=>{
  if(e.target === drawer) closeDrawer();
});

/* =========================
   RESEÑAS SLIDER (si existe)
========================= */
const track = document.getElementById("track");
const prev = document.getElementById("prev");
const next = document.getElementById("next");

function scrollByCard(dir){
  if(!track) return;
  const card = track.querySelector(".review");
  const w = card ? card.getBoundingClientRect().width : 320;
  track.scrollBy({ left: dir * (w + 14), behavior:"smooth" });
}

prev?.addEventListener("click", ()=>scrollByCard(-1));
next?.addEventListener("click", ()=>scrollByCard(1));

/* =========================
   REVEAL ANIMATIONS
========================= */
const revealEls = document.querySelectorAll(".reveal");

if("IntersectionObserver" in window){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealEls.forEach(el=>io.observe(el));
}else{
  revealEls.forEach(el=>el.classList.add("is-visible"));
}

/* =========================
   HEADER SHADOW ON SCROLL
========================= */
const header = document.querySelector(".header");
function onScroll(){
  if(!header) return;
  header.classList.toggle("is-shadow", window.scrollY > 8);
}
window.addEventListener("scroll", onScroll);
onScroll();

/* =========================
   YEAR
========================= */
const year = document.getElementById("year");
if(year) year.textContent = new Date().getFullYear();

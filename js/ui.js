import { WHATSAPP_NUMBER } from "./config.js";
import { cartCount } from "./store.js";

export function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function initYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}

export function initCartCount() {
  const el = document.getElementById("cartCount");
  if (el) el.textContent = String(cartCount());
}

export function initWhatsAppButtons(defaultMsg) {
  ["btnWhatsappHeader","btnWhatsappDrawer","waFloat"].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.href = waLink(defaultMsg);
  });
}

export function initDrawer() {
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
  drawer?.addEventListener("click", (e)=>{ if(e.target === drawer) closeDrawer(); });
}
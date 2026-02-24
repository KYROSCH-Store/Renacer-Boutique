/* ==========================
   CONFIG
========================== */
const WHATSAPP_NUMBER = "519XXXXXXXX"; // <-- CAMBIA AQUÍ (Perú +51)
const MSG_GENERAL = "Hola Renacer Boutique 👋 Quiero información para comprar. ¿Me ayudas?";

function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/* ==========================
   WHATSAPP LINKS (GLOBAL)
========================== */
const waTargets = [
  "btnWhatsappHeader",
  "btnWhatsappHero",
  "btnWhatsappDrawer",
  "btnWhatsappHelp",
  "btnWhatsappFinal",
  "waFloat"
];

waTargets.forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.href = waLink(MSG_GENERAL);
});

// Botones por producto: data-wa
document.querySelectorAll("[data-wa]").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const txt = a.getAttribute("data-wa") || MSG_GENERAL;
    window.open(waLink(txt), "_blank", "noopener");
  });
});

/* ==========================
   COPY ID
========================== */
document.querySelectorAll("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const id = btn.getAttribute("data-copy");
    if (!id) return;

    try {
      await navigator.clipboard.writeText(id);
      const old = btn.textContent;
      btn.textContent = "¡Copiado!";
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = old || "Copiar ID";
        btn.disabled = false;
      }, 1200);
    } catch (err) {
      alert("No se pudo copiar. Copia manual: " + id);
    }
  });
});

/* ==========================
   FILTERS
========================== */
const segButtons = document.querySelectorAll("[data-filter]");
const products = document.querySelectorAll(".product");

function setActiveSeg(activeBtn) {
  segButtons.forEach((b) => b.classList.remove("is-active"));
  activeBtn.classList.add("is-active");
}

segButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.getAttribute("data-filter");
    setActiveSeg(btn);

    products.forEach((card) => {
      const cat = card.getAttribute("data-cat");
      const show = filter === "all" || cat === filter;
      card.style.display = show ? "" : "none";
    });
  });
});

/* ==========================
   MOBILE DRAWER
========================== */
const burger = document.getElementById("burger");
const drawer = document.getElementById("drawer");
const drawerClose = document.getElementById("drawerClose");

function openDrawer() {
  if (!drawer || !burger) return;
  drawer.classList.add("is-open");
  drawer.setAttribute("aria-hidden", "false");
  burger.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  if (!drawer || !burger) return;
  drawer.classList.remove("is-open");
  drawer.setAttribute("aria-hidden", "true");
  burger.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

burger?.addEventListener("click", openDrawer);
drawerClose?.addEventListener("click", closeDrawer);

// cerrar tocando overlay
drawer?.addEventListener("click", (e) => {
  if (e.target === drawer) closeDrawer();
});

// cerrar al hacer click en un link
drawer?.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", closeDrawer);
});

/* ==========================
   SLIDER (RESEÑAS)
========================== */
const track = document.getElementById("track");
const prev = document.getElementById("prev");
const next = document.getElementById("next");

function scrollByCard(dir) {
  if (!track) return;
  const card = track.querySelector(".review");
  const w = card ? card.getBoundingClientRect().width : 320;
  track.scrollBy({ left: dir * (w + 14), behavior: "smooth" });
}

prev?.addEventListener("click", () => scrollByCard(-1));
next?.addEventListener("click", () => scrollByCard(1));

/* ==========================
   REVEAL ANIMATIONS (INTERSECTION OBSERVER)
========================== */
const revealEls = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  revealEls.forEach((el) => io.observe(el));
} else {
  // fallback: si el navegador es viejo
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* ==========================
   HEADER SHADOW ON SCROLL
========================== */
const header = document.querySelector(".header");
function onScroll() {
  if (!header) return;
  header.classList.toggle("is-shadow", window.scrollY > 8);
}
window.addEventListener("scroll", onScroll);
onScroll();

/* ==========================
   SMOOTH SCROLL (safe)
========================== */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (!id || id === "#") return;

    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

/* ==========================
   YEAR
========================== */
const y = document.getElementById("year");
if (y) y.textContent = new Date().getFullYear();
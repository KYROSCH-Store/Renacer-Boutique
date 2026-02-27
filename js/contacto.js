// js/contacto.js
// Contacto PRO (sin asumir ubicación del usuario)

const CONFIG = {
  whatsappNumber: "51956327144", // ✅ CAMBIA AL NÚMERO REAL (formato internacional SIN +)
  brandName: "Renacer Boutique",
  socials: {
    instagram: "#",
    facebook: "#",
    tiktok: "#",
  },
};

function waLink(text) {
  return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function setYear() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
}

function setSocialLinks() {
  const ig = document.getElementById("igLink");
  const fb = document.getElementById("fbLink");
  const tt = document.getElementById("ttLink");
  if (ig) ig.href = CONFIG.socials.instagram;
  if (fb) fb.href = CONFIG.socials.facebook;
  if (tt) tt.href = CONFIG.socials.tiktok;
}

function setWhatsAppButtons() {
  // ✅ Mensaje neutro, no asume ubicación
  const defaultMsg = `Hola ${CONFIG.brandName} 👋 Quiero hacer una consulta, ¿me ayudas?`;

  const ids = [
    "btnWhatsappHeader",
    "btnWhatsappDrawer",
    "btnWhatsappFinal",
    "btnWhatsappSide",
    "waFloat",
    "quickWhatsApp",
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.href = waLink(defaultMsg);
  });
}

function getVal(id) {
  return document.getElementById(id)?.value?.trim() || "";
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  const st = document.getElementById("contactStatus");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = getVal("c_name");
    const zone = document.getElementById("c_zone")?.value || ""; // es select
    const size = getVal("c_size");
    const topic = document.getElementById("c_topic")?.value || "Consulta";
    const msg = getVal("c_msg");

    if (!name || !msg) {
      if (st) st.textContent = "Completa nombre y mensaje.";
      return;
    }

    // ✅ Mensaje PRO: no asume datos; solo incluye lo que el usuario eligió
    const lines = [
      `Hola ${CONFIG.brandName} 👋`,
      `Mi nombre es ${name}.`,
      "",
      `Consulta: ${topic}`,
      size ? `Talla aproximada: ${size}` : null,
      zone ? `Zona (referencial): ${zone}` : null,
      "",
      "Mensaje:",
      msg,
    ].filter(Boolean);

    const finalMessage = lines.join("\n");

    if (st) st.textContent = "Abriendo WhatsApp…";
    window.open(waLink(finalMessage), "_blank", "noopener,noreferrer");
  });
}

(function start() {
  setYear();
  setSocialLinks();
  setWhatsAppButtons();
  initContactForm();
})();
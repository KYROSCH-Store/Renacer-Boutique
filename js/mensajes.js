const WHATSAPP_NUMBER = "519XXXXXXXX"; // <-- pon el número real con código país (Perú 51)

function waLink(text){
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

// Botones principales
const msgGeneral = "Hola Renacer Boutique 👋 Quiero información para comprar. ¿Me ayudas?";
["btnWhatsappTop","btnWhatsappHero","btnWhatsappBottom","waFloat"].forEach(id=>{
  const el = document.getElementById(id);
  if(el) el.href = waLink(msgGeneral);
});

// Botones por producto (data-wa)
document.querySelectorAll("[data-wa]").forEach(btn=>{
  btn.addEventListener("click", (e)=>{
    e.preventDefault();
    const text = btn.getAttribute("data-wa") || msgGeneral;
    window.open(waLink(text), "_blank");
  });
});
import { supabase } from "./supabaseClient.js";

const authBox = document.getElementById("authBox");
const adminApp = document.getElementById("adminApp");
const statusEl = document.getElementById("status");

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");

const skuEl = document.getElementById("sku");
const nameEl = document.getElementById("name");
const priceEl = document.getElementById("price");
const categoryEl = document.getElementById("category");
const sizeEl = document.getElementById("size");
const conditionEl = document.getElementById("condition");
const stockEl = document.getElementById("stock");
const imageUrlEl = document.getElementById("image_url");
const descEl = document.getElementById("description");

const saveBtn = document.getElementById("save");
const resetBtn = document.getElementById("reset");
const deleteBtn = document.getElementById("delete");
const listEl = document.getElementById("list");

function setStatus(msg){
  if(statusEl) statusEl.textContent = msg || "";
}

function resetForm(){
  skuEl.value = "";
  nameEl.value = "";
  priceEl.value = "";
  categoryEl.value = "mujer";
  sizeEl.value = "";
  conditionEl.value = "";
  stockEl.value = "1";
  imageUrlEl.value = "";
  descEl.value = "";
  setStatus("");
}

function fillForm(p){
  skuEl.value = p.sku || "";
  nameEl.value = p.name || "";
  priceEl.value = p.price ?? "";
  categoryEl.value = p.category || "mujer";
  sizeEl.value = p.size || "";
  conditionEl.value = p.condition || "";
  stockEl.value = p.stock ?? 1;
  imageUrlEl.value = p.image_url || "";
  descEl.value = p.description || "";
}

async function loadList(){
  const { data, error } = await supabase
    .from("products")
    .select("sku,name,price,category,stock,created_at")
    .order("created_at", { ascending: false });

  if(error){
    console.error(error);
    listEl.innerHTML = `<p class="muted">Error cargando productos.</p>`;
    return;
  }

  listEl.innerHTML = (data || []).map(p=>`
    <button type="button" class="btn btn--ghost btn--full"
      data-p='${JSON.stringify(p).replaceAll("'", "&apos;")}'>
      <strong>${p.sku}</strong> — ${p.name} • S/${Number(p.price||0).toFixed(0)} • ${p.category} • stock ${p.stock}
    </button>
  `).join("");

  listEl.querySelectorAll("[data-p]").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const p = JSON.parse(btn.getAttribute("data-p"));
      // Carga completo
      const { data: full, error } = await supabase
        .from("products")
        .select("*")
        .eq("sku", p.sku)
        .single();

      if(error){ console.error(error); setStatus("Error cargando producto."); return; }
      fillForm(full);
      setStatus("Producto cargado. Edita y guarda.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
}

async function checkSession(){
  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if(session){
    authBox.style.display = "none";
    adminApp.style.display = "block";
    await loadList();
  }else{
    authBox.style.display = "block";
    adminApp.style.display = "none";
  }
}

loginBtn?.addEventListener("click", async ()=>{
  setStatus("Ingresando...");
  const email = emailEl.value.trim();
  const password = passEl.value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if(error){
    console.error(error);
    setStatus("Error: usuario o contraseña incorrecta.");
    return;
  }
  setStatus("");
  await checkSession();
});

logoutBtn?.addEventListener("click", async ()=>{
  await supabase.auth.signOut();
  resetForm();
  await checkSession();
});

saveBtn?.addEventListener("click", async ()=>{
  const payload = {
    sku: skuEl.value.trim(),
    name: nameEl.value.trim(),
    price: Number(priceEl.value || 0),
    category: categoryEl.value,
    size: sizeEl.value.trim() || null,
    condition: conditionEl.value.trim() || null,
    stock: Number(stockEl.value || 1),
    image_url: imageUrlEl.value.trim() || null,
    description: descEl.value.trim() || null
  };

  if(!payload.sku || !payload.name || !payload.price){
    setStatus("Completa SKU, Nombre y Precio.");
    return;
  }

  setStatus("Guardando...");
  const { error } = await supabase.from("products").upsert(payload, { onConflict: "sku" });
  if(error){
    console.error(error);
    setStatus("Error guardando. Revisa RLS/políticas.");
    return;
  }

  setStatus("Guardado ✅");
  await loadList();
});

deleteBtn?.addEventListener("click", async ()=>{
  const sku = skuEl.value.trim();
  if(!sku){ setStatus("Pon el SKU a eliminar."); return; }

  setStatus("Eliminando...");
  const { error } = await supabase.from("products").delete().eq("sku", sku);
  if(error){
    console.error(error);
    setStatus("Error eliminando. Revisa permisos.");
    return;
  }
  setStatus("Eliminado ✅");
  resetForm();
  await loadList();
});

resetBtn?.addEventListener("click", resetForm);

checkSession();
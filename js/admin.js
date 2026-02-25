import { supabase } from "./supabaseClient.js";

/** =========================
 *  CONFIG
 * ========================= */
const BUCKET = "products";   // tu bucket exacto
const TABLE  = "products";    // tu tabla exacta

/** =========================
 *  DOM
 * ========================= */
const authBox = document.getElementById("authBox");
const adminApp = document.getElementById("adminApp");
const statusEl = document.getElementById("status");
const authStatus = document.getElementById("authStatus");

const emailEl = document.getElementById("email");
const passEl = document.getElementById("password");
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");

const form = document.getElementById("productForm");

const skuEl = document.getElementById("sku");
const nameEl = document.getElementById("name");
const priceEl = document.getElementById("price");
const categoryEl = document.getElementById("category");
const sizeEl = document.getElementById("size");
const conditionEl = document.getElementById("condition");
const stockEl = document.getElementById("stock");
const imageEl = document.getElementById("image");
const descEl = document.getElementById("description");

const resetBtn = document.getElementById("reset");
const deleteBtn = document.getElementById("delete");
const listEl = document.getElementById("list");

const previewWrap = document.getElementById("previewWrap");
const previewImg = document.getElementById("preview");
const currentImageText = document.getElementById("currentImageText");

/** =========================
 *  STATE
 * ========================= */
let currentProduct = null; // producto cargado (para editar)

/** =========================
 *  UI helpers
 * ========================= */
function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg || "";
}
function setAuthStatus(msg) {
  if (authStatus) authStatus.textContent = msg || "";
}
function showPreview(url) {
  if (!previewWrap || !previewImg || !currentImageText) return;
  if (!url) {
    previewWrap.style.display = "none";
    previewImg.src = "";
    currentImageText.textContent = "";
    return;
  }
  previewWrap.style.display = "block";
  previewImg.src = url;
  currentImageText.textContent = "Vista previa / imagen actual.";
}

function resetForm() {
  currentProduct = null;
  skuEl.value = "";
  nameEl.value = "";
  priceEl.value = "";
  categoryEl.value = "mujer";
  sizeEl.value = "";
  conditionEl.value = "";
  stockEl.value = "1";
  descEl.value = "";
  if (imageEl) imageEl.value = "";
  showPreview(null);
  setStatus("");
}

/** =========================
 *  Utils
 * ========================= */
function sanitizeFileName(name) {
  return (name || "image")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

function storagePathFromPublicUrl(url) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

async function requireSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data?.session) throw new Error("No hay sesión activa. Vuelve a iniciar sesión.");
  return data.session;
}

/** =========================
 *  Storage upload
 * ========================= */
async function uploadImage({ sku, file }) {
  await requireSession(); // 🔥 garantiza authenticated

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const base = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
  const filePath = `${sku}/${Date.now()}-${base}.${ext}`;

  const { error: uploadError } = await supabase
    .storage
    .from(BUCKET)
    .upload(filePath, file, {
      upsert: true,                 // evita choque si existiera
      contentType: file.type || undefined
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) throw new Error("No se pudo obtener URL pública.");
  return data.publicUrl;
}

async function deleteOldImageIfAny(oldPublicUrl) {
  const path = storagePathFromPublicUrl(oldPublicUrl);
  if (!path) return;
  // Si no tienes policy DELETE, solo avisará en consola (no rompe nada)
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn("No se pudo borrar imagen anterior:", error.message);
}

/** =========================
 *  Data
 * ========================= */
async function loadList() {
  listEl.innerHTML = `<p class="muted">Cargando…</p>`;

  const { data, error } = await supabase
    .from(TABLE)
    .select("sku,name,price,category,stock,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    listEl.innerHTML = `<p class="muted">Error cargando productos.</p>`;
    return;
  }

  if (!data?.length) {
    listEl.innerHTML = `<p class="muted">Aún no hay productos.</p>`;
    return;
  }

  listEl.innerHTML = data.map(p => `
    <button type="button" class="btn btn--ghost btn--full" data-sku="${p.sku}">
      <strong>${p.sku}</strong> — ${p.name} • S/${Number(p.price || 0).toFixed(0)} • ${p.category} • stock ${p.stock}
    </button>
  `).join("");

  listEl.querySelectorAll("[data-sku]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const sku = btn.getAttribute("data-sku");
      await loadProductToForm(sku);
    });
  });
}

async function loadProductToForm(sku) {
  setStatus("Cargando producto…");

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("sku", sku)
    .single();

  if (error) {
    console.error(error);
    setStatus("Error cargando producto.");
    return;
  }

  currentProduct = data;

  skuEl.value = data.sku || "";
  nameEl.value = data.name || "";
  priceEl.value = data.price ?? "";
  categoryEl.value = data.category || "mujer";
  sizeEl.value = data.size || "";
  conditionEl.value = data.condition || "";
  stockEl.value = data.stock ?? 1;
  descEl.value = data.description || "";

  showPreview(data.image_url || null);
  if (imageEl) imageEl.value = ""; // no obligar a cambiar foto al editar

  setStatus("Producto cargado. Edita y guarda.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** =========================
 *  Auth
 * ========================= */
async function checkSessionAndGate() {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;

  if (session) {
    authBox.style.display = "none";
    adminApp.style.display = "block";
    setAuthStatus("");
    await loadList();
  } else {
    authBox.style.display = "block";
    adminApp.style.display = "none";
  }
}

loginBtn?.addEventListener("click", async () => {
  setAuthStatus("Ingresando…");
  try {
    const email = (emailEl.value || "").trim();
    const password = passEl.value || "";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    setAuthStatus("");
    await checkSessionAndGate();
  } catch (err) {
    console.error(err);
    setAuthStatus("Error: " + (err?.message || "credenciales incorrectas"));
  }
});

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  resetForm();
  await checkSessionAndGate();
});

/** Preview local */
imageEl?.addEventListener("change", () => {
  const file = imageEl.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  showPreview(url);
});

/** =========================
 *  Save / Update
 * ========================= */
form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const sku = (skuEl.value || "").trim().toUpperCase();
  const name = (nameEl.value || "").trim();
  const price = Number(priceEl.value || 0);

  if (!sku || !name || !price) {
    setStatus("Completa SKU, Nombre y Precio.");
    return;
  }

  setStatus("Guardando…");

  try {
    // 1) Subir imagen si viene archivo
    let image_url = currentProduct?.image_url || null;
    const file = imageEl?.files?.[0];

    if (file) {
      const newUrl = await uploadImage({ sku, file });
      // Borrar anterior (opcional)
      if (image_url && image_url !== newUrl) await deleteOldImageIfAny(image_url);
      image_url = newUrl;
    }

    // 2) Upsert producto
    const payload = {
      sku,
      name,
      price,
      category: categoryEl.value,
      size: (sizeEl.value || "").trim() || null,
      condition: (conditionEl.value || "").trim() || null,
      stock: Number(stockEl.value || 1),
      image_url,
      description: (descEl.value || "").trim() || null,
    };

    const { error } = await supabase.from(TABLE).upsert(payload, { onConflict: "sku" });
    if (error) throw error;

    setStatus("Guardado ✅");
    if (imageEl) imageEl.value = "";
    currentProduct = payload; // mantener estado
    await loadList();
  } catch (err) {
    console.error(err);
    setStatus("Error: " + (err?.message || JSON.stringify(err)));
  }
});

/** =========================
 *  Delete
 * ========================= */
deleteBtn?.addEventListener("click", async () => {
  const sku = (skuEl.value || "").trim().toUpperCase();
  if (!sku) {
    setStatus("Pon el SKU a eliminar.");
    return;
  }

  setStatus("Eliminando…");
  try {
    // 1) leer imagen actual
    const { data: prod, error: readErr } = await supabase
      .from(TABLE)
      .select("image_url")
      .eq("sku", sku)
      .maybeSingle();

    if (readErr) console.warn(readErr);

    // 2) borrar row
    const { error } = await supabase.from(TABLE).delete().eq("sku", sku);
    if (error) throw error;

    // 3) borrar imagen (opcional)
    if (prod?.image_url) await deleteOldImageIfAny(prod.image_url);

    setStatus("Eliminado ✅");
    resetForm();
    await loadList();
  } catch (err) {
    console.error(err);
    setStatus("Error: " + (err?.message || JSON.stringify(err)));
  }
});

resetBtn?.addEventListener("click", resetForm);

/** Start */
checkSessionAndGate();
import { supabase } from "./supabaseClient.js";

/** CONFIG */
const BUCKET = "productos"; // tu bucket exacto
const TABLE = "products";

/** DOM */
const authBox = document.getElementById("authBox");
const adminApp = document.getElementById("adminApp");

const authStatus = document.getElementById("authStatus");
const statusEl = document.getElementById("status");

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

/** State */
let currentProduct = null; // producto cargado para editar (incluye image_url)

/** UI helpers */
function setAuthStatus(msg) {
  if (authStatus) authStatus.textContent = msg || "";
}
function setStatus(msg) {
  if (statusEl) statusEl.textContent = msg || "";
}
function showPreview(url) {
  if (!url) {
    previewWrap.style.display = "none";
    previewImg.src = "";
    currentImageText.textContent = "";
    return;
  }
  previewWrap.style.display = "block";
  previewImg.src = url;
  currentImageText.textContent = "Imagen actual cargada.";
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
  setStatus("");
  showPreview(null);
}

/** Safe filename */
function sanitizeFileName(name) {
  return (name || "image")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");
}

/** Extract storage path from public url */
function storagePathFromPublicUrl(url) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

/** Upload image file to storage and return public URL */
async function uploadImage({ sku, file }) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const base = sanitizeFileName(file.name.replace(/\.[^/.]+$/, ""));
  const filePath = `${sku}/${Date.now()}-${base}.${ext}`;

  const { error: uploadError } = await supabase
    .storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/** Optional: delete old image when replacing */
async function deleteOldImageIfAny(oldPublicUrl) {
  const path = storagePathFromPublicUrl(oldPublicUrl);
  if (!path) return;

  // Si no tienes policy DELETE, esto fallará (no rompe el save)
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    console.warn("No se pudo borrar imagen anterior (opcional):", error.message);
  }
}

/** Load products list */
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

  if (!data || data.length === 0) {
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

/** Load single product and fill form */
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

  setStatus("Producto cargado. Edita y guarda.");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Session gate */
async function checkSession() {
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

/** Auth */
loginBtn?.addEventListener("click", async () => {
  setAuthStatus("Ingresando…");
  const email = (emailEl.value || "").trim();
  const password = passEl.value || "";

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(error);
    setAuthStatus("Error: usuario o contraseña incorrecta.");
    return;
  }
  setAuthStatus("");
  await checkSession();
});

logoutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  resetForm();
  await checkSession();
});

/** Live preview for selected file */
imageEl?.addEventListener("change", () => {
  const file = imageEl.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  showPreview(url);
});

/** Save (create/update) */
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

  let image_url = currentProduct?.image_url || null;

  // If user selected a new image, upload it
  const file = imageEl?.files?.[0];
  if (file) {
    try {
      const newUrl = await uploadImage({ sku, file });

      // optional: delete old image
      if (image_url && image_url !== newUrl) {
        await deleteOldImageIfAny(image_url);
      }

      image_url = newUrl;
    } catch (err) {
      console.error(err);
      setStatus("Error subiendo imagen. Revisa policies del bucket.");
      return;
    }
  }

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

  const { error } = await supabase
    .from(TABLE)
    .upsert(payload, { onConflict: "sku" });

  if (error) {
    console.error(error);
    setStatus("Error guardando. Revisa RLS/políticas.");
    return;
  }

  setStatus("Guardado ✅");
  if (imageEl) imageEl.value = "";
  await loadList();
});

/** Delete product (and optional image) */
deleteBtn?.addEventListener("click", async () => {
  const sku = (skuEl.value || "").trim().toUpperCase();
  if (!sku) {
    setStatus("Pon el SKU a eliminar.");
    return;
  }

  setStatus("Eliminando…");

  // Fetch current for image deletion
  const { data: prod } = await supabase
    .from(TABLE)
    .select("image_url")
    .eq("sku", sku)
    .maybeSingle();

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("sku", sku);

  if (error) {
    console.error(error);
    setStatus("Error eliminando. Revisa permisos.");
    return;
  }

  // optional: remove image
  if (prod?.image_url) {
    await deleteOldImageIfAny(prod.image_url);
  }

  setStatus("Eliminado ✅");
  resetForm();
  await loadList();
});

resetBtn?.addEventListener("click", resetForm);

/** Start */
checkSession();
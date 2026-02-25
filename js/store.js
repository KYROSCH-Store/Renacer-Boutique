const CART_KEY = "rb_cart_v2";

export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
  catch { return []; }
}

export function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function cartCount() {
  const cart = getCart();
  return cart.reduce((acc, it) => acc + (it.qty || 1), 0);
}

export function addSku(sku) {
  const cart = getCart();
  const found = cart.find(x => x.sku === sku);
  if (found) found.qty += 1;
  else cart.push({ sku, qty: 1 });
  setCart(cart);
}

export function removeSku(sku) {
  const cart = getCart().filter(x => x.sku !== sku);
  setCart(cart);
}

export function clearCart() {
  setCart([]);
}
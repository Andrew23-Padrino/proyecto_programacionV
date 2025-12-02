import { firebaseServices_ap } from '/src/games/originales/firebase-services.js'

async function getOptionalToken(){
  try{
    const auth = firebaseServices_ap && firebaseServices_ap.auth ? firebaseServices_ap.auth : null
    if (!auth) return null
    const cur = auth.currentUser
    if (cur) { const t = await cur.getIdToken(); return t }
    const tkn = await new Promise((resolve)=>{
      let done = false
      const timeout = setTimeout(()=>{ if (done) return; done = true; resolve(null) }, 1200)
      const unsub = auth.onAuthStateChanged(async (u)=>{ if (done) return; done = true; try{ unsub() }catch(_){}; if (!u) return resolve(null); try{ const tt = await u.getIdToken(); resolve(tt) }catch(e){ resolve(null) } })
    })
    if (tkn) return tkn
    try{
      const mod = await import('https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js')
      if (mod && typeof mod.signInAnonymously === 'function') {
        await mod.signInAnonymously(auth)
        const anon = auth.currentUser
        if (anon) { const tt = await anon.getIdToken(); return tt }
      }
    }catch(_){ }
    return null
  }catch(e){ return null }
}

function getGuestId(){
  try{
    let gid = localStorage.getItem('nc_guest_id')
    if (!gid){ gid = 'g-' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('nc_guest_id', gid) }
    return gid
  }catch(_){ return 'g-' + Math.random().toString(36).slice(2) }
}

function apiFetch(path, opts = {}){
  return (async ()=>{
    const token = await getOptionalToken();
    const baseHeaders = { 'Content-Type': 'application/json', 'X-Guest-Id': getGuestId() }
    const headers = token ? Object.assign({}, opts.headers||{}, baseHeaders, { 'Authorization': 'Bearer ' + token }) : Object.assign({}, opts.headers||{}, baseHeaders)
    const r = await fetch(`http://localhost:${Number(import.meta.env?.STORE_PORT||8090)}${path}`, { ...opts, headers })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return r.json()
  })()
}

async function loadSections(){
  const res = await fetch(`http://localhost:${Number(import.meta.env?.STORE_PORT||8090)}/api/sections`)
  const secs = await res.json()
  const root = document.getElementById('tienda-sections')
  root.innerHTML = ''
  secs.forEach(s => {
    const btn = document.createElement('button')
    btn.className = 'btn btn-ghost'
    btn.textContent = s.name
    btn.addEventListener('click', ()=> loadProducts(s.slug))
    root.appendChild(btn)
  })
  if (Array.isArray(secs) && secs.length) { await loadProducts(secs[0].slug) }
}

async function loadProducts(slug){
  const root = document.getElementById('tienda-products')
  root.innerHTML = ''
  try{
    const res = await fetch(`http://localhost:${Number(import.meta.env?.STORE_PORT||8090)}/api/products?section=${encodeURIComponent(slug)}`)
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const prods = await res.json()
    if (!Array.isArray(prods) || prods.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'text-gray-600'
      empty.textContent = 'No hay productos en esta sección.'
      root.appendChild(empty)
      return
    }
    prods.forEach(p => {
      const card = document.createElement('div')
      card.className = 'border rounded p-3'
      const img = p.image ? `<img src="${p.image}" alt="${p.name}" class="w-full h-40 object-cover rounded mb-2" />` : ''
      card.innerHTML = `${img}<div class="font-semibold">${p.name}</div><div class="text-sm text-gray-600">${p.description||''}</div><div class="mt-2">Precio: <strong>$${Number(p.price_base).toFixed(2)} USD</strong></div>`
      const btn = document.createElement('button')
      btn.className = 'btn btn-primary mt-2'
      btn.textContent = 'Agregar al carrito'
      btn.addEventListener('click', ()=> addToCart(p.id, 1))
      card.appendChild(btn)
      root.appendChild(card)
    })
  }catch(e){
    const err = document.createElement('div')
    err.className = 'text-red-600'
    err.textContent = 'Error cargando productos. Intenta actualizar.'
    root.appendChild(err)
  }
}

async function addToCart(productId, qty){
  try{
    await apiFetch('/api/cart/items', { method: 'POST', body: JSON.stringify({ product_id: productId, qty }) })
    await loadCart()
  }catch(e){ alert('No se pudo agregar: ' + (e.message||e)) }
}

async function loadCart(){
  try{
    const data = await apiFetch('/api/cart', { method: 'GET' })
    const list = document.getElementById('tienda-cart-items')
    list.innerHTML = ''
    data.items.forEach(it => {
      const row = document.createElement('div')
      row.className = 'flex items-center justify-between'
      row.innerHTML = `<div>${it.name}</div><div>x${it.qty} — $${(it.price_unit).toFixed(2)} USD</div>`
      const del = document.createElement('button')
      del.className = 'btn btn-ghost'
      del.textContent = 'Eliminar'
      del.addEventListener('click', ()=> removeItem(it.id))
      row.appendChild(del)
      list.appendChild(row)
    })
    const t = data.totals
    document.getElementById('tienda-totals').innerHTML = `Base Imponible: <strong>$${t.base.toFixed(2)} USD</strong><br>IVA (${Math.round(t.iva_tasa*100)}%): <strong>$${t.iva.toFixed(2)} USD</strong><br>Descuento: <strong>$${t.discount.toFixed(2)} USD</strong><br>Total: <strong>$${t.total.toFixed(2)} USD</strong>`
  }catch(e){ console.warn(e) }
}

async function removeItem(id){
  try{ await apiFetch(`/api/cart/items/${id}`, { method: 'DELETE' }); await loadCart() }catch(e){ alert('Error eliminando: ' + (e.message||e)) }
}

async function applyCoupon(){
  const code = document.getElementById('tienda-coupon').value.trim()
  try{
    const data = await apiFetch('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code }) })
    document.getElementById('tienda-coupon-status').textContent = `Cupón aplicado: ${data.coupon.code}`
    await loadCart()
  }catch(e){ document.getElementById('tienda-coupon-status').textContent = 'Cupón inválido'; }
}

async function checkout(){
  try{
    const data = await apiFetch('/api/checkout', { method: 'POST' })
    const inv = document.getElementById('tienda-invoice')
    const pdfUrl = `http://localhost:${Number(import.meta.env?.STORE_PORT||8090)}/api/invoices/${data.invoice_id}/pdf`
    inv.innerHTML = `<div>Factura generada: N° ${data.invoice_number} — Control ${data.control_number}</div><div class="mt-2"><a class="underline" href="${pdfUrl}" target="_blank" rel="noopener">Imprimir PDF</a></div>`
    await loadCart()
  }catch(e){ alert('No se pudo finalizar: ' + (e.message||e)) }
}

function wire(){
  document.getElementById('tienda-apply-coupon')?.addEventListener('click', applyCoupon)
  document.getElementById('tienda-checkout')?.addEventListener('click', checkout)
  const openBtn = document.getElementById('tienda-open-cart')
  const closeBtn = document.getElementById('tienda-close-cart')
  const overlay = document.getElementById('tienda-cart-modal-overlay')
  const modal = document.getElementById('tienda-cart-modal')
  openBtn?.addEventListener('click', async ()=>{ await loadCart(); overlay?.classList.remove('hidden'); modal?.classList.remove('hidden') })
  closeBtn?.addEventListener('click', ()=>{ overlay?.classList.add('hidden'); modal?.classList.add('hidden') })
  overlay?.addEventListener('click', ()=>{ overlay?.classList.add('hidden'); modal?.classList.add('hidden') })
}

document.addEventListener('DOMContentLoaded', async ()=>{
  wire()
  await loadSections()
  await loadCart()
})

import { firebaseServices_ap } from '/src/games/originales/firebase-services.js'
import { ensureAuthenticated, showLoginRequiredModal } from '/src/games/bomba/utils.js'

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
    const baseHeaders = { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Guest-Id': getGuestId() }
    const headers = token ? Object.assign({}, opts.headers||{}, baseHeaders, { 'Authorization': 'Bearer ' + token }) : Object.assign({}, opts.headers||{}, baseHeaders)
    const tryFetch = async (url) => {
      const r = await fetch(url, { mode: 'cors', ...opts, headers })
      if (!r.ok) throw new Error('HTTP ' + r.status)
      const t = await r.text()
      if (!t) throw new Error('empty')
      return JSON.parse(t)
    }
    try { return await tryFetch(path) } catch (_e) { const abs = `http://localhost:8093${path}`; return await tryFetch(abs) }
  })()
}

async function loadCart(){
  try{
    const data = await apiFetch('/api/cart', { method: 'GET' })
    const list = document.getElementById('checkout-cart-items')
    list.innerHTML = ''
    data.items.forEach(it => {
      const row = document.createElement('div')
      row.className = 'flex items-center justify-between'
      row.innerHTML = `<div>${it.name}</div><div>x${it.qty} — $${(it.price_unit).toFixed(2)} USD</div>`
      list.appendChild(row)
    })
    const t = data.totals
    document.getElementById('checkout-totals').innerHTML = `Base Imponible: <strong>$${t.base.toFixed(2)} USD</strong><br>IVA (${Math.round(t.iva_tasa*100)}%): <strong>$${t.iva.toFixed(2)} USD</strong><br>Descuento: <strong>$${t.discount.toFixed(2)} USD</strong><br>Total: <strong>$${t.total.toFixed(2)} USD</strong>`
  }catch(e){ console.warn(e) }
}

function wirePaymentForms(){
  const rPagoMovil = document.getElementById('checkout-pm-pagomovil')
  const rTarjeta = document.getElementById('checkout-pm-tarjeta')
  const fPagoMovil = document.getElementById('checkout-form-pagomovil')
  const fTarjeta = document.getElementById('checkout-form-tarjeta')
  const updatePM = ()=>{
    const m = rTarjeta?.checked ? 'tarjeta' : 'pagomovil'
    if (m === 'tarjeta') { fTarjeta?.classList.remove('hidden'); fPagoMovil?.classList.add('hidden') }
    else { fPagoMovil?.classList.remove('hidden'); fTarjeta?.classList.add('hidden') }
  }
  rPagoMovil?.addEventListener('change', updatePM)
  rTarjeta?.addEventListener('change', updatePM)
  updatePM()
}

async function doPay(){
  try{
    const errEl = document.getElementById('checkout-error')
    if (errEl) errEl.textContent = ''
    const rTarjeta = document.getElementById('checkout-pm-tarjeta')
    const method = (rTarjeta && rTarjeta.checked) ? 'tarjeta' : 'pagomovil'
    let payment = null
    if (method === 'pagomovil') {
      const phone = document.getElementById('co-phone')?.value.trim()
      const cedula = document.getElementById('co-cedula')?.value.trim()
      const bankEl = document.getElementById('co-bank-code')
      const bank_code = (bankEl && bankEl.value || '').trim()
      const bank_name = bankEl && bankEl.selectedOptions && bankEl.selectedOptions[0] ? bankEl.selectedOptions[0].text : ''
      if (!phone || !cedula || !bank_code) { if (errEl) errEl.textContent = 'Completa teléfono, cédula y banco'; return }
      payment = { method, phone, cedula, bank_code, bank_name, bank: bank_name }
    } else {
      const card_number = document.getElementById('co-card-number')?.value.trim()
      const card_name = document.getElementById('co-card-name')?.value.trim()
      const card_exp = document.getElementById('co-card-exp')?.value.trim()
      const card_cvv = document.getElementById('co-card-cvv')?.value.trim()
      if (!card_number || !card_name || !card_exp || !card_cvv) { if (errEl) errEl.textContent = 'Completa los datos de la tarjeta'; return }
      payment = { method, card_number, card_name, card_exp, card_cvv }
    }
    const data = await apiFetch('/api/checkout', { method: 'POST', body: JSON.stringify({ payment }) })
    const inv = document.getElementById('checkout-invoice')
    const token = await getOptionalToken()
    const pdfUrl = (data && data.pdf_url) ? data.pdf_url : (token ? `/api/invoices/${data.invoice_id}/pdf?token=${encodeURIComponent(token)}` : `/api/invoices/${data.invoice_id}/pdf`)
    const pmText = payment?.method === 'tarjeta' ? 'Tarjeta' : 'Pago móvil'
    inv.innerHTML = `<div>Factura generada: N° ${data.invoice_number} — Control ${data.control_number}</div><div class="mt-1">Método: ${pmText}</div><div class="mt-2"><a id="checkout-print-link" class="underline" href="${pdfUrl}" target="_blank" rel="noopener">Imprimir PDF</a> <button id="checkout-print-btn" class="btn btn-ghost ml-2">Imprimir (seguro)</button></div>`
    document.getElementById('checkout-print-btn')?.addEventListener('click', async ()=>{
      try{
        const t = await getOptionalToken()
        const headers = t ? { 'Authorization': 'Bearer ' + t } : {}
        let r
        try{ r = await fetch(`/api/invoices/${data.invoice_id}/pdf`, { headers }) }catch(_){ r = await fetch(`http://localhost:8093/api/invoices/${data.invoice_id}/pdf`, { headers }) }
        if (!r.ok) throw new Error('HTTP ' + r.status)
        const blob = await r.blob()
        const href = URL.createObjectURL(blob)
        window.open(href, '_blank', 'noopener')
        setTimeout(()=> URL.revokeObjectURL(href), 5000)
      }catch(e){ alert('No se pudo abrir el PDF: ' + (e.message||e)) }
    })
    await loadCart()
  }catch(e){ alert('No se pudo finalizar: ' + (e.message||e)) }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const uid = await ensureAuthenticated()
  if (!uid) { showLoginRequiredModal({ message: 'Debes iniciar sesión para acceder al Checkout. Serás redirigido al login.' }); return }
  wirePaymentForms()
  await loadCart()
  document.getElementById('checkout-pay')?.addEventListener('click', doPay)
})

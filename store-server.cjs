// Tienda backend server (Express + SQLite + Firebase token verification)
// Provides: sections, products, cart, coupons, checkout, invoices, PDF
const express = require('express');
const path = require('path');
const fs = require('fs');
const process = require('process');
let fetchFn = global.fetch;
if (!fetchFn) fetchFn = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const Database = require('better-sqlite3');

// Load env (optional)
try { require('dotenv').config(); } catch (e) {}

const PORT = Number(process.env.STORE_PORT || process.env.PORT || 8091);
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'store.db');
const IVA_TASA = Number(process.env.IVA_TASA || 0.16);
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || '';

// Ensure data directory
const dir = path.dirname(DB_PATH);
try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch (e) {}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
function ensureMinimalMigrations(){
  try{
    const cols = db.prepare('PRAGMA table_info(products)').all();
    const hasImg = cols.some(c => c.name === 'image_path');
    if (!hasImg) { try{ db.exec('ALTER TABLE products ADD COLUMN image_path TEXT') }catch(_e){} }
    const hasStock = cols.some(c => c.name === 'stock');
    if (!hasStock) { try{ db.exec('ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0') }catch(_e){} }
    const invCols = db.prepare('PRAGMA table_info(invoices)').all();
    const hasCustEmail = invCols.some(c => c.name === 'customer_email');
    const hasCustName = invCols.some(c => c.name === 'customer_name');
    if (!hasCustEmail) { try{ db.exec('ALTER TABLE invoices ADD COLUMN customer_email TEXT') }catch(_e){} }
    if (!hasCustName) { try{ db.exec('ALTER TABLE invoices ADD COLUMN customer_name TEXT') }catch(_e){} }
  }catch(_){ }
}
function ensureSchema(){
  try{
    db.exec(`
      CREATE TABLE IF NOT EXISTS sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        active INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        price_base REAL NOT NULL,
        iva_tasa REAL NOT NULL DEFAULT ${IVA_TASA},
        active INTEGER NOT NULL DEFAULT 1,
        image_path TEXT,
        stock INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(section_id) REFERENCES sections(id)
      );
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firebase_uid TEXT NOT NULL UNIQUE,
        nombre TEXT,
        rif_ci TEXT,
        domicilio TEXT,
        creado_en TEXT
      );
      CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK(type IN ('percent','fixed')),
        value REAL NOT NULL,
        max_uses INTEGER,
        uses INTEGER NOT NULL DEFAULT 0,
        valid_from TEXT,
        valid_to TEXT,
        active INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS carts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        state TEXT NOT NULL DEFAULT 'active',
        created_at TEXT,
        updated_at TEXT,
        coupon_code TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cart_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        qty INTEGER NOT NULL,
        price_unit REAL NOT NULL,
        FOREIGN KEY(cart_id) REFERENCES carts(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
      );
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number INTEGER NOT NULL,
        control_number TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        customer_email TEXT,
        customer_name TEXT,
        fecha_hora TEXT NOT NULL,
        base_imponible REAL NOT NULL,
        iva_monto REAL NOT NULL,
        iva_tasa REAL NOT NULL,
        exentas_monto REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL,
        hash TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        descripcion TEXT NOT NULL,
        qty INTEGER NOT NULL,
        precio_unitario REAL NOT NULL,
        subtotal REAL NOT NULL,
        exento INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(invoice_id) REFERENCES invoices(id)
      );
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `);
    const c = db.prepare('SELECT COUNT(*) AS c FROM sections').get().c;
    if (c === 0) {
      const ins = db.prepare('INSERT INTO sections (name, slug, active) VALUES (?, ?, 1)');
      ins.run('Biología', 'biologia');
      ins.run('Astronomía', 'astronomia');
      ins.run('Geología', 'geologia');
    }
    const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
    if (!getSetting.get('invoice_next')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('invoice_next', '1');
    if (!getSetting.get('control_series')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('control_series', 'A');
    if (!getSetting.get('control_next')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('control_next', '00000001');
    if (!getSetting.get('imprenta_nombre')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('imprenta_nombre', 'Proveedor Tecnológico Demo C.A.');
    if (!getSetting.get('imprenta_rif')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('imprenta_rif', 'J-00000000-0');
    if (!getSetting.get('imprenta_autorizacion')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('imprenta_autorizacion', 'Providencia 0032 (demo)');
    if (!getSetting.get('emisor_nombre')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('emisor_nombre', 'NovaCiencia academy');
    if (!getSetting.get('emisor_rif')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('emisor_rif', 'J-12345678-9');
    if (!getSetting.get('emisor_domicilio')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('emisor_domicilio', 'Caracas, Venezuela');
  } catch(_e) {}
}

const app = express();
app.use(express.json());
// CORS (dev): allow frontend on 5174 and custom headers
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  const isLocal5173 = /:\/\/localhost:5173$/.test(origin);
  const isLocal5174 = /:\/\/localhost:5174$/.test(origin);
  const allowedOrigin = isLocal5173 || isLocal5174 ? origin : '*';
  try{ console.log('CORS origin=', origin, 'allow=', allowedOrigin) }catch(_){ }
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('X-Server-Instance', 'store-v2');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Guest-Id');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  next();
});

// Firebase ID token verification via Identity Toolkit (no service account)
async function verifyIdToken(idToken) {
  if (!idToken || !FIREBASE_API_KEY) return null;
  try {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
    const resp = await fetchFn(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
    if (!resp.ok) return null;
    const data = await resp.json();
    const user = data && Array.isArray(data.users) && data.users[0] ? data.users[0] : null;
    if (!user) return null;
    return { uid: user.localId, email: user.email, name: user.displayName };
  } catch (e) { return null; }
}

async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const qToken = (req.query && (req.query.token || req.query.idToken)) ? String(req.query.token || req.query.idToken) : null;
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : (qToken || null);
    console.log('authMiddleware token?', !!token, 'guestId hdr=', req.headers['x-guest-id']||'');
    const user = await verifyIdToken(token);
    let uid = null; let nombre = '';
    if (!user) {
      // guest fallback: allow cart operations without login
      const guestId = (req.headers['x-guest-id'] || '').toString() || (req.ip || 'guest');
      uid = 'guest:' + guestId;
      nombre = 'Invitado';
    } else {
      uid = user.uid; nombre = user.name || user.email || '';
    }
    // ensure user exists in DB
    const getUser = db.prepare('SELECT * FROM users WHERE firebase_uid = ?');
    let row = getUser.get(uid);
    if (!row) {
      const ins = db.prepare('INSERT INTO users (firebase_uid, nombre, creado_en) VALUES (?, ?, ?)').run(uid, nombre, new Date().toISOString());
      row = db.prepare('SELECT * FROM users WHERE id = ?').get(ins.lastInsertRowid);
    }
    req.user = row;
    req.authUser = user || null;
    req.token = token || null;
    next();
  } catch (e) {
    try{
      const guestId = (req.headers['x-guest-id'] || '').toString() || (req.ip || 'guest');
      const uid = 'guest:' + guestId;
      const getUser = db.prepare('SELECT * FROM users WHERE firebase_uid = ?');
      let row = getUser.get(uid);
      if (!row) {
        const ins = db.prepare('INSERT INTO users (firebase_uid, nombre, creado_en) VALUES (?, ?, ?)').run(uid, 'Invitado', new Date().toISOString());
        row = db.prepare('SELECT * FROM users WHERE id = ?').get(ins.lastInsertRowid);
      }
      req.user = row;
      req.authUser = null;
      req.token = null;
      next();
    }catch(_e){ res.status(401).json({ error: 'unauthorized' }); }
  }
}

function requireAuth(req, res, next) {
  const isGuest = !req.authUser || (req.user && String(req.user.firebase_uid || '').startsWith('guest:'));
  if (isGuest) return res.status(401).json({ error: 'unauthorized' });
  next();
}

// Sections
app.get('/api/sections', authMiddleware, requireAuth, (req, res) => {
  const rows = db.prepare('SELECT id, name, slug FROM sections WHERE active = 1 ORDER BY name').all();
  res.json(rows);
});

// Products by section
app.get('/api/products', authMiddleware, requireAuth, (req, res) => {
  const slug = (req.query.section || '').toString();
  const sec = db.prepare('SELECT id FROM sections WHERE slug = ? AND active = 1').get(slug);
  if (!sec) return res.json([]);
  const rows = db.prepare('SELECT p.id, p.name, p.description, p.price_base, p.iva_tasa, p.image_path AS image, p.stock, s.name AS categoria FROM products p JOIN sections s ON s.id = p.section_id WHERE p.section_id = ? AND p.active = 1 ORDER BY p.name').all(sec.id);
  res.json(rows);
});

// Get active cart
app.get('/api/cart', authMiddleware, requireAuth, (req, res) => {
  try{
    try{ console.log('[GET /api/cart] user=', req.user.id) }catch(_){}
    try{ console.log('[GET /api/cart] SQL sel carts WHERE state = ?', 'active') }catch(_){}
    const cart = db.prepare('SELECT * FROM carts WHERE user_id = ? AND state = ?').get(req.user.id, 'active');
    let cartId = cart ? cart.id : null;
    if (!cartId) {
      try{ console.log('[GET /api/cart] SQL insert cart state', 'active') }catch(_){}
      const ins = db.prepare('INSERT INTO carts (user_id, state, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .run(req.user.id, 'active', new Date().toISOString(), new Date().toISOString());
      cartId = ins.lastInsertRowid;
    }
    const items = db.prepare('SELECT ci.id, ci.qty, ci.price_unit, p.name FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?').all(cartId);
    const totals = computeCartTotals(cartId);
    res.json({ id: cartId, items, totals });
  }catch(e){ try{ console.error('get_cart_failed', e); }catch(_){}; res.status(500).json({ ok:false, error: 'get_cart_failed', details: String(e && e.message ? e.message : e) }) }
});

// Add/update item
app.post('/api/cart/items', authMiddleware, requireAuth, (req, res) => {
  try {
    const { product_id, qty } = req.body || {};
    try{ console.log('[POST /api/cart/items] payload', req.body) }catch(_){ }
    const pid = Number(product_id); const quantity = Number(qty);
    if (!pid || !quantity || quantity <= 0) return res.status(400).json({ ok:false, error: 'invalid_payload' });
    const prod = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(pid);
    try{ console.log('[POST /api/cart/items] product exists?', !!prod) }catch(_){ }
    if (!prod) return res.status(404).json({ ok:false, error: 'not_found' });
    if (Number(prod.stock) <= 0) return res.status(409).json({ ok:false, error: 'out_of_stock' });
    if (quantity > Number(prod.stock)) return res.status(409).json({ ok:false, error: 'insufficient_stock', available: Number(prod.stock) });
    try{ console.log('[POST /api/cart/items] select cart state', 'active', 'user', req.user.id) }catch(_){ }
    const cart = db.prepare('SELECT * FROM carts WHERE user_id = ? AND state = ?').get(req.user.id, 'active');
    let cartId = cart ? cart.id : null;
    if (!cartId) {
      try{ console.log('[POST /api/cart/items] create new cart with state', 'active') }catch(_){ }
      cartId = db.prepare('INSERT INTO carts (user_id, state, created_at, updated_at) VALUES (?, ?, ?, ?)').run(req.user.id, 'active', new Date().toISOString(), new Date().toISOString()).lastInsertRowid;
    }
    const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?').get(cartId, pid);
    if (existing) { db.prepare('UPDATE cart_items SET qty = ?, price_unit = ? WHERE id = ?').run(quantity, prod.price_base, existing.id); }
    else { db.prepare('INSERT INTO cart_items (cart_id, product_id, qty, price_unit) VALUES (?, ?, ?, ?)').run(cartId, pid, quantity, prod.price_base); }
    const totals = computeCartTotals(cartId);
    res.json({ ok: true, cart_id: cartId, totals });
  } catch (e) {
    try{ console.error('cart_items_add_failed', e); }catch(_){}
    res.status(500).json({ ok:false, error: 'cart_items_add_failed', details: String(e && e.message ? e.message : e) });
  }
});

// Remove item
app.delete('/api/cart/items/:id', authMiddleware, requireAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  const cart = db.prepare('SELECT * FROM carts WHERE user_id = ? AND state = ?').get(req.user.id, 'active');
  if (!cart) return res.status(404).json({ error: 'no_cart' });
  db.prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?').run(id, cart.id);
  const totals = computeCartTotals(cart.id);
  res.json({ ok: true, totals });
});

// Apply coupon (validate and store on cart)
app.post('/api/coupons/validate', authMiddleware, requireAuth, (req, res) => {
  const { code } = req.body || {};
  const cart = db.prepare('SELECT * FROM carts WHERE user_id = ? AND state = ?').get(req.user.id, 'active');
  if (!cart) return res.status(404).json({ error: 'no_cart' });
  const coupon = validateCoupon(code);
  if (!coupon.valid) return res.status(400).json({ error: coupon.reason });
  db.prepare('UPDATE carts SET coupon_code = ?, updated_at = ? WHERE id = ?').run(code.trim(), new Date().toISOString(), cart.id);
  const totals = computeCartTotals(cart.id);
  res.json({ ok: true, coupon: coupon.info, totals });
});

// Checkout: create invoice and finalize cart
app.post('/api/checkout', authMiddleware, requireAuth, (req, res) => {
  const pm = (req.body && req.body.payment) || null;
  if (!pm || !pm.method) return res.status(400).json({ error: 'payment_required' });
  if (pm.method === 'pagomovil') {
    if (!pm.phone || !pm.cedula || !(pm.bank || pm.bank_code)) return res.status(400).json({ error: 'payment_invalid' });
  } else if (pm.method === 'tarjeta') {
    if (!pm.card_number || !pm.card_name || !pm.card_exp || !pm.card_cvv) return res.status(400).json({ error: 'payment_invalid' });
  } else {
    return res.status(400).json({ error: 'payment_invalid' });
  }
  const cart = db.prepare('SELECT * FROM carts WHERE user_id = ? AND state = ?').get(req.user.id, 'active');
  if (!cart) return res.status(404).json({ error: 'no_cart' });
  const items = db.prepare('SELECT ci.*, p.name, p.iva_tasa FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?').all(cart.id);
  if (!items.length) return res.status(400).json({ error: 'empty_cart' });
  const totals = computeCartTotals(cart.id);
  const invNo = nextInvoiceNumber();
  const ctrlNo = nextControlNumber();
  const fecha = new Date().toISOString();
  const custEmail = (req.authUser && req.authUser.email) || null;
  const custName = (req.authUser && (req.authUser.name || req.authUser.email)) || (req.user && req.user.nombre) || 'Invitado';
  const insInv = db.prepare('INSERT INTO invoices (invoice_number, control_number, user_id, customer_email, customer_name, fecha_hora, base_imponible, iva_monto, iva_tasa, exentas_monto, total, hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
  const hash = makeHash({ invNo, ctrlNo, uid: req.user.firebase_uid, email: custEmail, name: custName, totals, fecha });
  const invRes = insInv.run(invNo, ctrlNo, req.user.id, custEmail, custName, fecha, totals.base, totals.iva, totals.iva_tasa, totals.exentas, totals.total, hash);
  const invId = invRes.lastInsertRowid;
  const insItem = db.prepare('INSERT INTO invoice_items (invoice_id, descripcion, qty, precio_unitario, subtotal, exento) VALUES (?,?,?,?,?,?)');
  items.forEach(it => {
    const subtotal = it.qty * it.price_unit;
    insItem.run(invId, it.name, it.qty, it.price_unit, subtotal, 0);
  });
  db.prepare('UPDATE carts SET state = ?, updated_at = ? WHERE id = ?').run('checked_out', new Date().toISOString(), cart.id);
  const pdfUrl = req.token ? `/api/invoices/${invId}/pdf?token=${encodeURIComponent(req.token)}` : `/api/invoices/${invId}/pdf`;
  res.json({ ok: true, invoice_id: invId, invoice_number: invNo, control_number: ctrlNo, totals, payment: { method: pm.method }, pdf_url: pdfUrl });
});

// Invoice JSON
app.get('/api/invoices/:id', authMiddleware, requireAuth, (req, res) => {
  const id = Number(req.params.id || 0);
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!inv) return res.status(404).json({ error: 'not_found' });
  const items = db.prepare('SELECT descripcion, qty, precio_unitario, subtotal, exento FROM invoice_items WHERE invoice_id = ?').all(id);
  const emisor = getSettings(['emisor_nombre','emisor_rif','emisor_domicilio']);
  const imprenta = getSettings(['imprenta_nombre','imprenta_rif','imprenta_autorizacion']);
  const pdfUrl = req.token ? `/api/invoices/${id}/pdf?token=${encodeURIComponent(req.token)}` : `/api/invoices/${id}/pdf`;
  res.json({ inv, items, emisor, imprenta, pdf_url: pdfUrl });
});

// Invoice PDF
app.get('/api/invoices/:id/pdf', authMiddleware, requireAuth, async (req, res) => {
  const id = Number(req.params.id || 0);
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
  if (!inv) return res.status(404).json({ error: 'not_found' });
  const items = db.prepare('SELECT descripcion, qty, precio_unitario, subtotal, exento FROM invoice_items WHERE invoice_id = ?').all(id);
  const emisor = getSettings(['emisor_nombre','emisor_rif','emisor_domicilio']);
  const imprenta = getSettings(['imprenta_nombre','imprenta_rif','imprenta_autorizacion']);
  const html = renderInvoiceHTML({ inv, items, emisor, imprenta });
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="factura_${inv.invoice_number}.pdf"`);
    res.send(pdf);
  } catch (e) {
    res.status(500).json({ error: 'pdf_failed', details: String(e) });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  try{ console.error('uncaught_error', err); }catch(_){ }
  res.status(500).json({ ok:false, error:'internal_error', details: String(err && err.message ? err.message : err) });
});

// Helpers
function computeCartTotals(cartId) {
  const cart = db.prepare('SELECT * FROM carts WHERE id = ?').get(cartId);
  const rows = db.prepare('SELECT ci.qty, ci.price_unit, p.iva_tasa FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.cart_id = ?').all(cartId);
  let base = 0; let exentas = 0; const iva_tasa = IVA_TASA; // single rate for simplicity
  rows.forEach(r => { const subtotal = r.qty * r.price_unit; base += subtotal; });
  // Coupon application reduces base
  let discount = 0;
  if (cart && cart.coupon_code) {
    const v = validateCoupon(cart.coupon_code);
    if (v.valid) {
      if (v.info.type === 'percent') discount = base * (v.info.value / 100);
      else discount = Math.min(base, v.info.value);
    }
  }
  base = Math.max(0, base - discount);
  const iva = +(base * iva_tasa).toFixed(2);
  const total = +(base + iva + exentas).toFixed(2);
  return { base: +base.toFixed(2), iva, iva_tasa, exentas: +exentas.toFixed(2), total, discount: +discount.toFixed(2) };
}

function validateCoupon(code) {
  if (!code || !code.toString().trim()) return { valid: false, reason: 'invalid_code' };
  const c = db.prepare('SELECT * FROM coupons WHERE code = ? AND active = 1').get(code.trim());
  if (!c) return { valid: false, reason: 'not_found' };
  const now = new Date();
  if (c.valid_from && new Date(c.valid_from) > now) return { valid: false, reason: 'not_started' };
  if (c.valid_to && new Date(c.valid_to) < now) return { valid: false, reason: 'expired' };
  if (c.max_uses && c.uses >= c.max_uses) return { valid: false, reason: 'uses_exceeded' };
  return { valid: true, info: { code: c.code, type: c.type, value: c.value } };
}

function nextInvoiceNumber() {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('invoice_next');
  const cur = row ? Number(row.value) : 1;
  db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('invoice_next', String(cur + 1));
  return cur;
}

function nextControlNumber() {
  const series = db.prepare('SELECT value FROM settings WHERE key = ?').get('control_series')?.value || 'A';
  const next = db.prepare('SELECT value FROM settings WHERE key = ?').get('control_next')?.value || '00000001';
  const num = String(next).padStart(8, '0');
  const cur = `${series}${num}`;
  const inc = (Number(num) + 1).toString().padStart(8, '0');
  db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('control_next', inc);
  return cur;
}

function getSettings(keys) {
  const stmt = db.prepare('SELECT key, value FROM settings WHERE key IN (' + keys.map(()=>'?').join(',') + ')');
  const rows = stmt.all(...keys);
  const out = {}; rows.forEach(r => out[r.key] = r.value);
  return out;
}

function makeHash(obj) {
  const crypto = require('crypto');
  const str = JSON.stringify(obj);
  return crypto.createHash('sha256').update(str).digest('hex');
}

function renderInvoiceHTML({ inv, items, emisor, imprenta }) {
  const dateStr = new Date(inv.fecha_hora).toLocaleString('es-VE');
  const rows = items.map(it => `<tr><td>${escape(it.descripcion)}</td><td style="text-align:right">${it.qty}</td><td style="text-align:right">${it.precio_unitario.toFixed(2)}</td><td style="text-align:right">${it.subtotal.toFixed(2)}</td></tr>`).join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Factura ${inv.invoice_number}</title><style>
  body{font-family:Arial, sans-serif; font-size:12px; color:#111;}
  .container{max-width:780px;margin:20px auto;padding:18px;border:1px solid #e5e7eb;border-radius:8px}
  h1{font-size:20px;margin:0 0 6px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  table{width:100%;border-collapse:collapse;margin-top:10px}
  th,td{padding:6px;border-bottom:1px solid #eee}
  .right{text-align:right}
  .muted{color:#666}
  .footer{margin-top:12px;font-size:11px;color:#555}
  </style></head><body>
  <div class="container">
    <h1>FACTURA</h1>
    <div class="grid">
      <div>
        <div><strong>N° Factura:</strong> ${inv.invoice_number}</div>
        <div><strong>N° Control:</strong> ${escape(inv.control_number)}</div>
        <div><strong>Fecha/Hora:</strong> ${escape(dateStr)}</div>
      </div>
      <div>
        <div><strong>Emisor:</strong> ${escape(emisor.emisor_nombre || '')}</div>
        <div><strong>RIF:</strong> ${escape(emisor.emisor_rif || '')}</div>
        <div><strong>Domicilio Fiscal:</strong> ${escape(emisor.emisor_domicilio || '')}</div>
      </div>
    </div>
    <div style="margin-top:8px">
      <div><strong>Cliente:</strong> ${escape(inv.customer_name || '')}</div>
      <div><span class="muted">Correo:</span> ${escape(inv.customer_email || '')}</div>
    </div>
    <table><thead><tr><th>Descripción</th><th class="right">Cant.</th><th class="right">Precio Unit.</th><th class="right">Subtotal</th></tr></thead><tbody>
      ${rows}
    </tbody></table>
    <div style="margin-top:8px">
      <div>Base Imponible: <strong>$${inv.base_imponible.toFixed(2)} USD</strong></div>
      <div>IVA (${(inv.iva_tasa*100).toFixed(0)}%): <strong>$${inv.iva_monto.toFixed(2)} USD</strong></div>
      <div>Exentas/Exoneradas: <strong>$${inv.exentas_monto.toFixed(2)} USD</strong></div>
      <div>Total a pagar: <strong>$${inv.total.toFixed(2)} USD</strong></div>
    </div>
    <div class="footer">
      <div>Proveedor Tecnológico: ${escape(imprenta.imprenta_nombre || '')} — RIF ${escape(imprenta.imprenta_rif || '')}</div>
      <div>Autorización: ${escape(imprenta.imprenta_autorizacion || '')}</div>
      <div class="muted">Firma electrónica (hash interno): ${escape(inv.hash || '')}</div>
    </div>
  </div>
  </body></html>`;
}

function escape(s){ return String(s || '').replace(/[&<>"']/g, (c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }

ensureMinimalMigrations();
async function start(){
  try{
    const mod = await import(path.join(process.cwd(),'src','DB','db.js'));
    if (mod && typeof mod.migrateOnExistingDB === 'function') {
      mod.migrateOnExistingDB(db, IVA_TASA);
    }
  }catch(_e){}
  ensureSchema();
  try{
    const ensureSec = db.prepare('INSERT OR IGNORE INTO sections (name, slug, active) VALUES (?, ?, 1)');
    ensureSec.run('Biología', 'biologia');
    ensureSec.run('Astronomía', 'astronomia');
    ensureSec.run('Geología', 'geologia');
    const getSecId = (slug)=>{ const r = db.prepare('SELECT id FROM sections WHERE slug = ? AND active = 1').get(slug); return r ? r.id : null };
    const secIds = { astronomia: getSecId('astronomia'), biologia: getSecId('biologia'), geologia: getSecId('geologia') };
    const snakeBase = (s)=> s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    const lite = (s)=> snakeBase(s).replace(/\b(de|del|la|el|y|a|para)\b/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'');
    const resolveImagePath = (folder, name)=>{
      const aliases = {
        Astronomia: {
          'Lámpara de Luna 3D': 'lampara_luna_3d.jpg',
          'Proyector de Planetario': 'proyector_planetario.jpg'
        },
        'Biología': {
          'Botes con Lupa': 'botes_lupa.jpg',
          'Caja de Preparaciones': 'caja_preparaciones.jpg',
          'Esqueleto a Escala': 'esqueleto_escala.webp',
          'Estetoscopio Educativo': 'estetoscopio.jpg',
          'Hormiguero de Gel': 'hormiguero.jpg',
          'Torso Humano Desmontable': 'torso_humano.jpg'
        },
        'Geología': {
          'Caja Colección Minerales': 'caja_minerales.jpg',
          'Lupa de Geólogo': 'lupa_geologo.webp',
          'Martillo de Geólogo': 'martillo_geologo.jpg',
          'Tambor de Pulido': 'tambor_pulido.jpg'
        }
      };
      try{
        const f = aliases[folder] && aliases[folder][name];
        if (f) {
          const rel = path.join('img','Tienda', folder, f);
          const abs = path.join(process.cwd(), 'public', rel);
          if (fs.existsSync(abs)) return '/' + rel.replace(/\\/g,'/');
        }
      }catch(_){ }
      const base = snakeBase(name);
      const baseLite = lite(name);
      const candidates = [ `${base}.jpg`, `${base}.jpeg`, `${base}.png`, `${base}.webp`, `${baseLite}.jpg`, `${baseLite}.jpeg`, `${baseLite}.png`, `${baseLite}.webp` ];
      for (const fn of candidates){
        const rel = path.join('img','Tienda', folder, fn);
        const abs = path.join(process.cwd(), 'public', rel);
        try{ if (fs.existsSync(abs)) return '/' + rel.replace(/\\/g,'/') }catch(e){}
      }
      try{
        const dirAbs = path.join(process.cwd(), 'public', 'img', 'Tienda', folder);
        const files = fs.readdirSync(dirAbs);
        for (const f of files){
          const stem = f.replace(/\.[^.]+$/, '');
          const norm = snakeBase(stem);
          const normLite = lite(stem);
          if (norm === base || normLite === baseLite || norm.includes(baseLite) || baseLite.includes(norm)) {
            const rel = path.join('img','Tienda', folder, f);
            return '/' + rel.replace(/\\/g,'/');
          }
        }
      }catch(_){ }
      return null;
    };
    const products = [
      { section: 'astronomia', folder: 'Astronomia', name: 'Telescopio Refractor', price: 110, stock: 0, description: 'Instrumento clásico de tubo largo, perfecto para que principiantes observen la Luna y planetas brillantes.' },
      { section: 'astronomia', folder: 'Astronomia', name: 'Binoculares Astronómicos', price: 75, stock: 10, description: 'Lentes de gran apertura (7x50) que permiten ver cúmulos de estrellas y la Vía Láctea.' },
      { section: 'astronomia', folder: 'Astronomia', name: 'Planisferio', price: 15, stock: 10, description: 'Disco ajustable manual que muestra qué estrellas son visibles según la fecha y hora.' },
      { section: 'astronomia', folder: 'Astronomia', name: 'Modelo Sistema Solar Motorizado', price: 40, stock: 10, description: 'Maqueta que simula el movimiento de los planetas alrededor del Sol.' },
      { section: 'astronomia', folder: 'Astronomia', name: 'Lámpara de Luna 3D', price: 25, stock: 10, description: 'Esfera iluminada con textura realista de cráteres lunares.' },
      { section: 'astronomia', folder: 'Astronomia', name: 'Proyector de Planetario', price: 80, stock: 10, description: 'Dispositivo que proyecta un mapa realista de estrellas y nebulosas en el techo.' },
      { section: 'astronomia', folder: 'Astronomia', name: 'Puntero Láser Verde', price: 30, stock: 10, description: 'Herramienta potente para señalar estrellas específicas durante observaciones.' },
      { section: 'astronomia', folder: 'Astronomia', name: 'Gafas Eclipses Solares', price: 5, stock: 10, description: 'Lentes especiales con filtro solar que bloquean la radiación dañina.' },
      { section: 'astronomia', folder: 'Astronomia', name: 'Globo Terráqueo Celeste', price: 70, stock: 10, description: 'Esfera que muestra las constelaciones y coordenadas galácticas.' },
      { section: 'astronomia', folder: 'Astronomia', name: 'Globo Terráqueo Tradicional', price: 45, stock: 10, description: 'La clásica esfera del mundo con geografía política y física.' },
      { section: 'biologia', folder: 'Biología', name: 'Microscopio Óptico', price: 100, stock: 0, description: 'Instrumento de laboratorio para ver células y microorganismos invisibles al ojo.' },
      { section: 'biologia', folder: 'Biología', name: 'Caja de Preparaciones', price: 20, stock: 10, description: 'Set de portaobjetos de vidrio con muestras listas (tejidos, insectos).' },
      { section: 'biologia', folder: 'Biología', name: 'Hormiguero de Gel', price: 25, stock: 10, description: 'Hábitat transparente con gel nutritivo para observar túneles de hormigas.' },
      { section: 'biologia', folder: 'Biología', name: 'Torso Humano Desmontable', price: 65, stock: 10, description: 'Modelo anatómico donde se pueden sacar y poner los órganos.' },
      { section: 'biologia', folder: 'Biología', name: 'Libro Biología Básico', price: 20, stock: 10, description: 'Guía ilustrada que explica fundamentos de la vida y ecosistemas.' },
      { section: 'biologia', folder: 'Biología', name: 'Kit Cultivo Plantas', price: 20, stock: 10, description: 'Pequeño invernadero con semillas para aprender sobre germinación.' },
      { section: 'biologia', folder: 'Biología', name: 'Esqueleto a Escala', price: 60, stock: 10, description: 'Réplica detallada del sistema óseo para estudiar la estructura del cuerpo.' },
      { section: 'biologia', folder: 'Biología', name: 'Botes con Lupa', price: 8, stock: 10, description: 'Recipientes con lupa en la tapa para capturar y observar insectos.' },
      { section: 'biologia', folder: 'Biología', name: 'Modelo ADN', price: 30, stock: 10, description: 'Kit de piezas encajables para construir la doble hélice genética.' },
      { section: 'biologia', folder: 'Biología', name: 'Estetoscopio Educativo', price: 20, stock: 10, description: 'Instrumento para escuchar latidos del corazón y respiración.' },
      { section: 'geologia', folder: 'Geología', name: 'Tambor de Pulido', price: 75, stock: 10, description: 'Máquina rotatoria que lija y pule piedras rugosas hasta dejarlas brillantes.' },
      { section: 'geologia', folder: 'Geología', name: 'Kit Excavación Fósiles', price: 20, stock: 10, description: 'Bloque de yeso con herramientas para descubrir réplicas de huesos.' },
      { section: 'geologia', folder: 'Geología', name: 'Caja Colección Minerales', price: 30, stock: 10, description: 'Selección organizada de rocas etiquetadas para iniciar colección.' },
      { section: 'geologia', folder: 'Geología', name: 'Geodas Naturales', price: 25, stock: 10, description: 'Rocas huecas que al romperse revelan cristales brillantes dentro.' },
      { section: 'geologia', folder: 'Geología', name: 'Lupa de Geólogo', price: 15, stock: 10, description: 'Lente pequeña potente (10x) para examinar texturas de rocas.' },
      { section: 'geologia', folder: 'Geología', name: 'Martillo de Geólogo', price: 40, stock: 10, description: 'Herramienta con punta plana y pico para recolectar rocas.' },
      { section: 'geologia', folder: 'Geología', name: 'Kit Cultivo Cristales', price: 20, stock: 10, description: 'Set químico para formar cristales coloridos en pocos días.' },
      { section: 'geologia', folder: 'Geología', name: 'Set Dureza Mohs', price: 35, stock: 10, description: 'Colección de minerales de referencia para testear dureza.' }
    ];
    const find = db.prepare('SELECT id FROM products WHERE section_id = ? AND name = ?');
    const insert = db.prepare('INSERT INTO products (section_id, name, description, price_base, iva_tasa, active, image_path, stock) VALUES (?,?,?,?,?,1,?,?)');
    products.forEach(p => {
      const sid = secIds[p.section];
      if (!sid) return;
      const ex = find.get(sid, p.name);
      const img = resolveImagePath(p.folder, p.name);
      try{ console.log('[seed-image]', p.name, '=>', img) }catch(_){}
      if (ex) {
        db.prepare('UPDATE products SET description = ?, price_base = ?, iva_tasa = ?, image_path = ?, stock = ? WHERE id = ?').run(p.description, p.price, IVA_TASA, img, p.stock ?? 10, ex.id);
      } else {
        insert.run(sid, p.name, p.description, p.price, IVA_TASA, img, p.stock ?? 10);
      }
    });
  }catch(_e){}
  app.listen(PORT, () => {
    console.log('Store server listening on', PORT);
  });
}
start();

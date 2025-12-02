import fs from 'fs'
import path from 'path'
import Database from 'better-sqlite3'

export function initDB({ dbPath, ivaTasa }){
  const dir = path.dirname(dbPath)
  try{ if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }catch(e){}
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  migrateOnExistingDB(db, ivaTasa)
  return db
}

export function migrateOnExistingDB(db, ivaTasa){
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
      iva_tasa REAL NOT NULL DEFAULT ${ivaTasa},
      active INTEGER NOT NULL DEFAULT 1,
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
  `)
  const secCount = db.prepare('SELECT COUNT(*) AS c FROM sections').get().c
  if (secCount === 0) {
    const insertSec = db.prepare('INSERT INTO sections (name, slug, active) VALUES (?, ?, 1)')
    const secBiol = insertSec.run('Biología', 'biologia')
    const secAst = insertSec.run('Astronomía', 'astronomia')
    const secGeo = insertSec.run('Geología', 'geologia')
    const insertProd = db.prepare('INSERT INTO products (section_id, name, description, price_base, iva_tasa, active) VALUES (?,?,?,?,?,1)')
    insertProd.run(secBiol.lastInsertRowid, 'Guía de Células', 'Material educativo PDF', 10.0, ivaTasa)
    insertProd.run(secAst.lastInsertRowid, 'Mapa Estelar', 'Poster digital de constelaciones', 8.0, ivaTasa)
    insertProd.run(secGeo.lastInsertRowid, 'Minerales Básicos', 'Ficha didáctica', 6.0, ivaTasa)
  }
  const prodCols = db.prepare('PRAGMA table_info(products)').all()
  if (!prodCols.find(c => c.name === 'image_path')) { try{ db.exec('ALTER TABLE products ADD COLUMN image_path TEXT') }catch(e){} }
  const ensureSec = db.prepare('INSERT OR IGNORE INTO sections (name, slug, active) VALUES (?, ?, 1)')
  ensureSec.run('Biología', 'biologia')
  ensureSec.run('Astronomía', 'astronomia')
  ensureSec.run('Geología', 'geologia')
  const getSecId = (slug)=>{ const r = db.prepare('SELECT id FROM sections WHERE slug = ?').get(slug); return r ? r.id : null }
  const secIds = { astronomia: getSecId('astronomia'), biologia: getSecId('biologia'), geologia: getSecId('geologia') }
  const snakeBase = (s)=> s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'')
  const resolveImagePath = (folder, name)=>{
    const base = snakeBase(name)
    const candidates = [ `${base}.jpg`, `${base}.jpeg`, `${base}.png`, `${base}.webp` ]
    for (const fn of candidates){
      const rel = path.join('img','Tienda', folder, fn)
      const abs = path.join(process.cwd(), 'public', rel)
      try{ if (fs.existsSync(abs)) return '/' + rel.replace(/\\/g,'/') }catch(e){}
    }
    return `/img/Tienda/${folder}/${base}.jpg`
  }
  const products = [
    { section: 'astronomia', folder: 'Astronomia', name: 'Telescopio Refractor', price: 110, description: 'Instrumento clásico de tubo largo, perfecto para que principiantes observen la Luna y planetas brillantes.' },
    { section: 'astronomia', folder: 'Astronomia', name: 'Binoculares Astronómicos', price: 75, description: 'Lentes de gran apertura (7x50) que permiten ver cúmulos de estrellas y la Vía Láctea.' },
    { section: 'astronomia', folder: 'Astronomia', name: 'Planisferio', price: 15, description: 'Disco ajustable manual que muestra qué estrellas son visibles según la fecha y hora.' },
    { section: 'astronomia', folder: 'Astronomia', name: 'Modelo Sistema Solar Motorizado', price: 40, description: 'Maqueta que simula el movimiento de los planetas alrededor del Sol.' },
    { section: 'astronomia', folder: 'Astronomia', name: 'Lámpara de Luna 3D', price: 25, description: 'Esfera iluminada con textura realista de cráteres lunares.' },
    { section: 'astronomia', folder: 'Astronomia', name: 'Proyector de Planetario', price: 80, description: 'Dispositivo que proyecta un mapa realista de estrellas y nebulosas en el techo.' },
    { section: 'astronomia', folder: 'Astronomia', name: 'Puntero Láser Verde', price: 30, description: 'Herramienta potente para señalar estrellas específicas durante observaciones.' },
    { section: 'astronomia', folder: 'Astronomia', name: 'Gafas Eclipses Solares', price: 5, description: 'Lentes especiales con filtro solar que bloquean la radiación dañina.' },
    { section: 'astronomia', folder: 'Astronomia', name: 'Globo Terráqueo Celeste', price: 70, description: 'Esfera que muestra las constelaciones y coordenadas galácticas.' },
    { section: 'astronomia', folder: 'Astronomia', name: 'Globo Terráqueo Tradicional', price: 45, description: 'La clásica esfera del mundo con geografía política y física.' },
    { section: 'biologia', folder: 'Biología', name: 'Microscopio Óptico', price: 100, description: 'Instrumento de laboratorio para ver células y microorganismos invisibles al ojo.' },
    { section: 'biologia', folder: 'Biología', name: 'Caja de Preparaciones', price: 20, description: 'Set de portaobjetos de vidrio con muestras listas (tejidos, insectos).' },
    { section: 'biologia', folder: 'Biología', name: 'Hormiguero de Gel', price: 25, description: 'Hábitat transparente con gel nutritivo para observar túneles de hormigas.' },
    { section: 'biologia', folder: 'Biología', name: 'Torso Humano Desmontable', price: 65, description: 'Modelo anatómico donde se pueden sacar y poner los órganos.' },
    { section: 'biologia', folder: 'Biología', name: 'Libro Biología Básico', price: 20, description: 'Guía ilustrada que explica fundamentos de la vida y ecosistemas.' },
    { section: 'biologia', folder: 'Biología', name: 'Kit Cultivo Plantas', price: 20, description: 'Pequeño invernadero con semillas para aprender sobre germinación.' },
    { section: 'biologia', folder: 'Biología', name: 'Esqueleto a Escala', price: 60, description: 'Réplica detallada del sistema óseo para estudiar la estructura del cuerpo.' },
    { section: 'biologia', folder: 'Biología', name: 'Botes con Lupa', price: 8, description: 'Recipientes con lupa en la tapa para capturar y observar insectos.' },
    { section: 'biologia', folder: 'Biología', name: 'Modelo ADN', price: 30, description: 'Kit de piezas encajables para construir la doble hélice genética.' },
    { section: 'biologia', folder: 'Biología', name: 'Estetoscopio Educativo', price: 20, description: 'Instrumento para escuchar latidos del corazón y respiración.' },
    { section: 'geologia', folder: 'Geología', name: 'Tambor de Pulido', price: 75, description: 'Máquina rotatoria que lija y pule piedras rugosas hasta dejarlas brillantes.' },
    { section: 'geologia', folder: 'Geología', name: 'Kit Excavación Fósiles', price: 20, description: 'Bloque de yeso con herramientas para descubrir réplicas de huesos.' },
    { section: 'geologia', folder: 'Geología', name: 'Caja Colección Minerales', price: 30, description: 'Selección organizada de rocas etiquetadas para iniciar colección.' },
    { section: 'geologia', folder: 'Geología', name: 'Geodas Naturales', price: 25, description: 'Rocas huecas que al romperse revelan cristales brillantes dentro.' },
    { section: 'geologia', folder: 'Geología', name: 'Lupa de Geólogo', price: 15, description: 'Lente pequeña potente (10x) para examinar texturas de rocas.' },
    { section: 'geologia', folder: 'Geología', name: 'Martillo de Geólogo', price: 40, description: 'Herramienta con punta plana y pico para recolectar rocas.' },
    { section: 'geologia', folder: 'Geología', name: 'Kit Cultivo Cristales', price: 20, description: 'Set químico para formar cristales coloridos en pocos días.' },
    { section: 'geologia', folder: 'Geología', name: 'Set Dureza Mohs', price: 35, description: 'Colección de minerales de referencia para testear dureza.' },
    { section: 'geologia', folder: 'Geología', name: 'Volcán para Armar', price: 15, description: 'Maqueta para pintar y simular erupciones con vinagre.' },
    { section: 'geologia', folder: 'Geología', name: 'Detector de Metales Jr', price: 50, description: 'Dispositivo ligero que suena al encontrar metales enterrados.' }
  ]
  const insertProdFull = db.prepare('INSERT INTO products (section_id, name, description, price_base, iva_tasa, active, image_path) VALUES (?,?,?,?,?,1,?)')
  const findProdByName = db.prepare('SELECT id FROM products WHERE section_id = ? AND name = ?')
  const updateImg = db.prepare('UPDATE products SET image_path = ? WHERE section_id = ? AND name = ?')
  for (const p of products){
    const sid = secIds[p.section]
    if (!sid) continue
    const ex = findProdByName.get(sid, p.name)
    const ip = resolveImagePath(p.folder, p.name)
    if (ex) { updateImg.run(ip, sid, p.name); continue }
    insertProdFull.run(sid, p.name, p.description, p.price, ivaTasa, ip)
  }
  const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?')
  if (!getSetting.get('invoice_next')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('invoice_next', '1')
  if (!getSetting.get('control_series')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('control_series', 'A')
  if (!getSetting.get('control_next')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('control_next', '00000001')
  if (!getSetting.get('imprenta_nombre')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('imprenta_nombre', 'Proveedor Tecnológico Demo C.A.')
  if (!getSetting.get('imprenta_rif')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('imprenta_rif', 'J-00000000-0')
  if (!getSetting.get('imprenta_autorizacion')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('imprenta_autorizacion', 'Providencia 0032 (demo)')
  if (!getSetting.get('emisor_nombre')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('emisor_nombre', 'NovaCiencia academy')
  if (!getSetting.get('emisor_rif')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('emisor_rif', 'J-12345678-9')
  if (!getSetting.get('emisor_domicilio')) db.prepare('INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)').run('emisor_domicilio', 'Caracas, Venezuela')
}

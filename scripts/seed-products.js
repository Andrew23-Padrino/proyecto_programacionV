const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'store.db');
const IVA_TASA = Number(process.env.IVA_TASA || 0.16);

function snakeBase(s){
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
}
function resolveImagePath(folder, name){
  const base = snakeBase(name);
  const candidates = [ `${base}.jpg`, `${base}.jpeg`, `${base}.png`, `${base}.webp` ];
  for (const fn of candidates){
    const rel = path.join('img','Tienda', folder, fn);
    const abs = path.join(process.cwd(), 'public', rel);
    try{ if (fs.existsSync(abs)) return '/' + rel.replace(/\\/g,'/'); }catch(e){}
  }
  return null;
}

const PRODUCTS = [
  // Astronomía
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
  // Biología
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
  // Geología
  { section: 'geologia', folder: 'Geología', name: 'Tambor de Pulido', price: 75, description: 'Máquina rotatoria que lija y pule piedras rugosas hasta dejarlas brillantes.' },
  { section: 'geologia', folder: 'Geología', name: 'Kit Excavación Fósiles', price: 20, description: 'Bloque de yeso con herramientas para descubrir réplicas de huesos.' },
  { section: 'geologia', folder: 'Geología', name: 'Caja Colección Minerales', price: 30, description: 'Selección organizada de rocas etiquetadas para iniciar colección.' },
  { section: 'geologia', folder: 'Geología', name: 'Geodas Naturales', price: 25, description: 'Rocas huecas que al romperse revelan cristales brillantes dentro.' },
  { section: 'geologia', folder: 'Geología', name: 'Lupa de Geólogo', price: 15, description: 'Lente pequeña potente (10x) para examinar texturas de rocas.' },
  { section: 'geologia', folder: 'Geología', name: 'Martillo de Geólogo', price: 40, description: 'Herramienta con punta plana y pico para recolectar rocas.' },
  { section: 'geologia', folder: 'Geología', name: 'Kit Cultivo Cristales', price: 20, description: 'Set químico para formar cristales coloridos en pocos días.' },
  { section: 'geologia', folder: 'Geología', name: 'Set Dureza Mohs', price: 35, description: 'Colección de minerales de referencia para testear dureza.' }
];

function main(){
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  // Ensure sections exist
  const ensureSec = db.prepare('INSERT OR IGNORE INTO sections (name, slug, active) VALUES (?, ?, 1)');
  ensureSec.run('Biología', 'biologia');
  ensureSec.run('Astronomía', 'astronomia');
  ensureSec.run('Geología', 'geologia');
  const getSecId = (slug)=>{ const r = db.prepare('SELECT id FROM sections WHERE slug = ?').get(slug); return r ? r.id : null; };
  const secIds = { astronomia: getSecId('astronomia'), biologia: getSecId('biologia'), geologia: getSecId('geologia') };
  const find = db.prepare('SELECT id FROM products WHERE section_id = ? AND name = ?');
  const insert = db.prepare('INSERT INTO products (section_id, name, description, price_base, iva_tasa, active, image_path) VALUES (?,?,?,?,?,1,?)');
  let added = 0; let updated = 0;
  for (const p of PRODUCTS){
    const sid = secIds[p.section];
    if (!sid) continue;
    const ex = find.get(sid, p.name);
    const img = resolveImagePath(p.folder, p.name);
    if (ex){
      // Update price/description/image
      db.prepare('UPDATE products SET description = ?, price_base = ?, iva_tasa = ?, image_path = ? WHERE id = ?').run(p.description, p.price, IVA_TASA, img, ex.id);
      updated++;
    }else{
      insert.run(sid, p.name, p.description, p.price, IVA_TASA, img);
      added++;
    }
  }
  console.log(`Seed done. Added=${added} Updated=${updated}`);
}

if (require.main === module) {
  try{ main(); }catch(e){ console.error(e); process.exit(1); }
}


const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app_ap = express();
const PORT_ap = process.env.PORT || 3000;

// Middleware
app_ap.use(cors());
app_ap.use(express.json());
app_ap.use(express.static('public'));

// Database connection
const db_ap = new sqlite3.Database('education_store.db', (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
  } else {
  console.log('Conectado a la base de datos SQLite');
  initializeDatabase_ap();
  ensureProductImages_ap();
  }
});

// Initialize database tables
const initializeDatabase_ap = () => {
  // Create products table
  db_ap.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      precio REAL NOT NULL,
      categoria TEXT NOT NULL,
      imagen TEXT,
      descripcion TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla products:', err);
    } else {
      console.log('Tabla products creada/verificada');
      populateProducts_ap();
    }
  });

  // Create cart_items table
  db_ap.run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear tabla cart_items:', err);
    } else {
      console.log('Tabla cart_items creada/verificada');
    }
  });
};

// Populate products with educational materials
const populateProducts_ap = () => {
  const products = [
    {
      nombre: 'Calculadora Científica',
      precio: 24.99,
      categoria: 'Herramientas',
      imagen: '/assets/img/CienciasNaturales.jpg',
      descripcion: 'Calculadora científica con funciones avanzadas para estudios'
    },
    {
      nombre: 'Kit de Geología',
      precio: 65.75,
      categoria: 'Laboratorio',
      imagen: '/assets/img/Geologia.jpg',
      descripcion: 'Colección de minerales y rocas para estudio geológico'
    },
    {
      nombre: 'Kit de Química Básico',
      precio: 89.50,
      categoria: 'Laboratorio',
      imagen: '/assets/img/CienciasNaturales.jpg',
      descripcion: 'Set completo para experimentos de química básica'
    },
    {
      nombre: 'Microscopio Estudiantil',
      precio: 159.99,
      categoria: 'Laboratorio',
      imagen: '/assets/img/Biologia.jpg',
      descripcion: 'Microscopio de alta calidad para estudiantes de biología'
    },
    {
      nombre: 'Libro de Física Avanzada',
      precio: 45.99,
      categoria: 'Libros',
      imagen: '/assets/img/CienciasNaturales.jpg',
      descripcion: 'Textbook completo con teoría y prácticas de física moderna'
    },
    {
      nombre: 'Set de Astronomía',
      precio: 79.90,
      categoria: 'Libros',
      imagen: '/assets/img/Astronomia.jpg',
      descripcion: 'Libro de astronomía con mapas estelares y guía de constelaciones'
    }
  ];

  // Check if products already exist
  db_ap.get('SELECT COUNT(*) as count FROM products', (err, row) => {
    if (err) {
      console.error('Error al verificar productos:', err);
      return;
    }
    
    if (row.count === 0) {
      const stmt = db_ap.prepare('INSERT INTO products (nombre, precio, categoria, imagen, descripcion) VALUES (?, ?, ?, ?, ?)');
      
      products.forEach(product => {
        stmt.run(product.nombre, product.precio, product.categoria, product.imagen, product.descripcion);
      });
      
      stmt.finalize(() => {
        console.log('Productos educativos insertados en la base de datos');
      });
    } else {
      console.log('Los productos ya existen en la base de datos');
    }
  });
};

// Ensure local image paths are set for existing products
const ensureProductImages_ap = () => {
  const mappings_ap = [
    { nombre: 'Calculadora Científica', imagen: '/assets/img/CienciasNaturales.jpg' },
    { nombre: 'Kit de Geología', imagen: '/assets/img/Geologia.jpg' },
    { nombre: 'Kit de Química Básico', imagen: '/assets/img/CienciasNaturales.jpg' },
    { nombre: 'Microscopio Estudiantil', imagen: '/assets/img/Biologia.jpg' },
    { nombre: 'Libro de Física Avanzada', imagen: '/assets/img/CienciasNaturales.jpg' },
    { nombre: 'Set de Astronomía', imagen: '/assets/img/Astronomia.jpg' }
  ];

  const stmt_ap = db_ap.prepare('UPDATE products SET imagen = ? WHERE nombre = ?');
  mappings_ap.forEach(m => { stmt_ap.run(m.imagen, m.nombre); });
  stmt_ap.finalize(() => { console.log('URLs de imágenes actualizadas'); });
};

// API Routes

// GET all products
app_ap.get('/api/products', (req, res) => {
  db_ap.all('SELECT * FROM products ORDER BY id', (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Error al obtener productos' });
    } else {
      res.json(rows);
    }
  });
});

// GET cart items
app_ap.get('/api/cart', (req, res) => {
  const query = `
    SELECT cart_items.id, cart_items.product_id, cart_items.quantity, 
           products.nombre, products.precio, products.categoria, products.imagen, products.descripcion
    FROM cart_items 
    JOIN products ON cart_items.product_id = products.id
    ORDER BY cart_items.id
  `;
  
  db_ap.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Error al obtener carrito' });
    } else {
      res.json(rows);
    }
  });
});

// ADD to cart
app_ap.post('/api/cart/add', (req, res) => {
  const { productId, quantity } = req.body;
  
  if (!productId || !quantity) {
    return res.status(400).json({ error: 'Product ID y cantidad son requeridos' });
  }
  
  // Check if product already exists in cart
  db_ap.get('SELECT * FROM cart_items WHERE product_id = ?', [productId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Error al verificar carrito' });
    }
    
    if (row) {
      // Update quantity if product exists
      const newQuantity = row.quantity + quantity;
      db_ap.run('UPDATE cart_items SET quantity = ? WHERE product_id = ?', [newQuantity, productId], (err) => {
        if (err) {
          res.status(500).json({ error: 'Error al actualizar cantidad' });
        } else {
          res.json({ message: 'Cantidad actualizada en el carrito' });
        }
      });
    } else {
      // Insert new product
      db_ap.run('INSERT INTO cart_items (product_id, quantity) VALUES (?, ?)', [productId, quantity], (err) => {
        if (err) {
          res.status(500).json({ error: 'Error al agregar al carrito' });
        } else {
          res.json({ message: 'Producto agregado al carrito' });
        }
      });
    }
  });
});

// UPDATE cart item quantity
app_ap.put('/api/cart/update/:productId', (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  
  if (!quantity || quantity < 0) {
    return res.status(400).json({ error: 'Cantidad inválida' });
  }
  
  if (quantity === 0) {
    // Remove item if quantity is 0
    db_ap.run('DELETE FROM cart_items WHERE product_id = ?', [productId], (err) => {
      if (err) {
        res.status(500).json({ error: 'Error al eliminar del carrito' });
      } else {
        res.json({ message: 'Producto eliminado del carrito' });
      }
    });
  } else {
    // Update quantity
    db_ap.run('UPDATE cart_items SET quantity = ? WHERE product_id = ?', [quantity, productId], (err) => {
      if (err) {
        res.status(500).json({ error: 'Error al actualizar cantidad' });
      } else {
        res.json({ message: 'Cantidad actualizada' });
      }
    });
  }
});

// REMOVE from cart
app_ap.delete('/api/cart/remove/:productId', (req, res) => {
  const { productId } = req.params;
  
  db_ap.run('DELETE FROM cart_items WHERE product_id = ?', [productId], (err) => {
    if (err) {
      res.status(500).json({ error: 'Error al eliminar del carrito' });
    } else {
      res.json({ message: 'Producto eliminado del carrito' });
    }
  });
});

// CHECKOUT - Clear cart
app_ap.post('/api/cart/checkout', (req, res) => {
  db_ap.run('DELETE FROM cart_items', (err) => {
    if (err) {
      res.status(500).json({ error: 'Error al procesar checkout' });
    } else {
      res.json({ message: 'Compra realizada con éxito. Carrito vaciado.' });
    }
  });
});

// Start server
app_ap.listen(PORT_ap, () => {
  console.log(`Servidor Tienda ejecutándose en http://localhost:${PORT_ap}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nCerrando servidor...');
  db_ap.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err);
    } else {
      console.log('Base de datos cerrada correctamente');
    }
    process.exit(0);
  });
});
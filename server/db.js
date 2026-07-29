import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'store.db');

let SQL = null;
let sqlDb = null;

async function getSQL() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

function createWrapper(sqlDb) {
  const wrapper = {
    exec(sql) {
      sqlDb.exec(sql);
    },

    pragma(key) {
      sqlDb.run(`PRAGMA ${key}`);
      return true;
    },

    prepare(sql) {
      return {
        run(...params) {
          try {
            sqlDb.run(sql, params);
            const lastId = sqlDb.exec('SELECT last_insert_rowid() as id');
            const changes = sqlDb.getRowsModified();
            const id = lastId.length > 0 ? lastId[0].values[0] : [0];
            return { changes, lastInsertRowid: Number(id[0]) };
          } catch (err) {
            throw err;
          }
        },
        get(...params) {
          try {
            const stmt = sqlDb.prepare(sql);
            if (params.length > 0) stmt.bind(params);
            if (stmt.step()) {
              const row = stmt.getAsObject();
              stmt.free();
              return convertTypes(row);
            }
            stmt.free();
            return undefined;
          } catch (err) {
            throw err;
          }
        },
        all(...params) {
          try {
            const stmt = sqlDb.prepare(sql);
            if (params.length > 0) stmt.bind(params);
            const rows = [];
            while (stmt.step()) {
              rows.push(convertTypes(stmt.getAsObject()));
            }
            stmt.free();
            return rows;
          } catch (err) {
            throw err;
          }
        }
      };
    },

    save() {
      const data = sqlDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    },

    close() {
      if (saveInterval) clearInterval(saveInterval);
      wrapper.save();
      sqlDb.close();
    }
  };

  return wrapper;
}

function convertTypes(obj) {
  if (!obj) return obj;
  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (typeof val === 'number' && (key === 'c' || key === 'count' || key.endsWith('_count') || key.endsWith('_id') || key === 'stock' || key === 'minimum_stock' || key === 'quantity')) {
      result[key] = Math.round(val);
    } else {
      result[key] = val;
    }
  }
  return result;
}

let saveInterval;

async function initializeDatabase() {
  await getSQL();

  let fileData = null;
  try {
    if (fs.existsSync(dbPath)) {
      fileData = fs.readFileSync(dbPath);
    }
  } catch (e) {
    fileData = null;
  }

  sqlDb = new SQL.Database(fileData || undefined);
  const db = createWrapper(sqlDb);
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT NOT NULL,
      customer_name TEXT DEFAULT '',
      message TEXT NOT NULL,
      sender TEXT NOT NULL CHECK(sender IN ('customer', 'ai', 'employee')),
      message_type TEXT DEFAULT 'text' CHECK(message_type IN ('text', 'image', 'document', 'audio', 'video', 'location')),
      media_url TEXT DEFAULT '',
      media_id TEXT DEFAULT '',
      ai_response TEXT DEFAULT '',
      processed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  try { db.exec('ALTER TABLE whatsapp_messages ADD COLUMN media_url TEXT DEFAULT \'\''); } catch (e) {}
  try { db.exec('ALTER TABLE whatsapp_messages ADD COLUMN media_id TEXT DEFAULT \'\''); } catch (e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT UNIQUE NOT NULL,
      full_name TEXT DEFAULT '',
      email TEXT DEFAULT '',
      city TEXT DEFAULT '',
      address TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      total_spent REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      preferred_payment TEXT DEFAULT '',
      preferred_shipping TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      brand TEXT DEFAULT '',
      model TEXT DEFAULT '',
      category TEXT DEFAULT '' CHECK(category IN ('Display','Battery','Charging Port','Flex Cable','Housing','Camera','IC','Connector','Speaker','Microphone','Frame','Back Cover','Accessory','Tool')),
      product_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      purchase_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      minimum_stock INTEGER DEFAULT 5,
      barcode TEXT DEFAULT '',
      supplier TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS product_compatibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      compatible_brand TEXT DEFAULT '',
      compatible_model TEXT NOT NULL,
      compatible_version TEXT DEFAULT '',
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('IN','OUT','SALE','RETURN','ADJUSTMENT','TRANSFER')),
      quantity INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      employee TEXT DEFAULT 'System',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending','Confirmed','Preparing','Ready for Pickup','Shipped','Completed','Cancelled')),
      subtotal REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      payment_method TEXT DEFAULT '',
      payment_status TEXT DEFAULT 'Pending' CHECK(payment_status IN ('Pending','Paid','Partial','Refunded')),
      shipping_address TEXT DEFAULT '',
      tracking_number TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT DEFAULT '',
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_name TEXT DEFAULT 'Mobile Parts Store',
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      city TEXT DEFAULT '',
      country TEXT DEFAULT '',
      business_hours TEXT DEFAULT 'Mon-Fri 9:00 AM - 6:00 PM',
      about TEXT DEFAULT 'We provide high-quality mobile phone spare parts for all major brands.',
      facebook TEXT DEFAULT '',
      instagram TEXT DEFAULT '',
      tiktok TEXT DEFAULT '',
      website TEXT DEFAULT '',
      logo_url TEXT DEFAULT '',
      currency TEXT DEFAULT 'USD',
      tax_percentage REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS pending_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT NOT NULL,
      customer_name TEXT DEFAULT '',
      reason TEXT DEFAULT '',
      message_context TEXT DEFAULT '',
      resolved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    )
  `);

  createIndexes(db);
  insertDefaultSettings(db);
  insertSeedData(db);

  saveInterval = setInterval(() => {
    db.save();
  }, 30000);

  return db;
}

/*
Carga datos de demostración: productos, clientes y compatibilidades.
Solo inserta si las tablas están vacías para no duplicar.
*/
function insertSeedData(db) {
  const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get();
  if (productCount.c > 0) return;

  const insertProduct = db.prepare(`
    INSERT INTO products (sku, brand, model, category, product_name, description, purchase_price, sale_price, stock, minimum_stock, supplier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const products = [
    { sku: 'SAM-A54-DISP', brand: 'Samsung', model: 'Galaxy A54', category: 'Display', name: 'Pantalla Samsung Galaxy A54 OLED', desc: 'Pantalla OLED original 6.4" FHD+. Incluye marco y digitalizador.', cost: 280, price: 450, stock: 15, min: 3 },
    { sku: 'SAM-A54-BAT', brand: 'Samsung', model: 'Galaxy A54', category: 'Battery', name: 'Batería Samsung Galaxy A54 5000mAh', desc: 'Batería original 5000mAh. Compatible con carga rápida 25W.', cost: 80, price: 150, stock: 25, min: 5 },
    { sku: 'SAM-A54-PORT', brand: 'Samsung', model: 'Galaxy A54', category: 'Charging Port', name: 'Puerto de Carga Samsung Galaxy A54 USB-C', desc: 'Módulo de carga USB-C con flex. Incluye micrófono.', cost: 35, price: 70, stock: 40, min: 5 },
    { sku: 'SAM-A54-FLEX', brand: 'Samsung', model: 'Galaxy A54', category: 'Flex Cable', name: 'Flex de Carga Samsung Galaxy A54', desc: 'Flex de conexión del puerto de carga a placa base.', cost: 25, price: 55, stock: 30, min: 5 },
    { sku: 'SAM-A54-CAM', brand: 'Samsung', model: 'Galaxy A54', category: 'Camera', name: 'Cámara Trasera Samsung Galaxy A54 50MP', desc: 'Módulo de cámara principal 50MP OIS. Original.', cost: 200, price: 380, stock: 8, min: 2 },
    { sku: 'SAM-A54-CAMF', brand: 'Samsung', model: 'Galaxy A54', category: 'Camera', name: 'Cámara Frontal Samsung Galaxy A54 32MP', desc: 'Módulo de cámara selfie 32MP. Original.', cost: 90, price: 180, stock: 10, min: 2 },
    { sku: 'SAM-A54-SPK', brand: 'Samsung', model: 'Galaxy A54', category: 'Speaker', name: 'Parlante Samsung Galaxy A54', desc: 'Parlante multimedia original. Sonido estéreo.', cost: 45, price: 90, stock: 20, min: 5 },
    { sku: 'SAM-A54-HOUS', brand: 'Samsung', model: 'Galaxy A54', category: 'Housing', name: 'Carcasa Completa Samsung Galaxy A54', desc: 'Carcasa trasera con marco. Incluye botones y bandeja SIM.', cost: 120, price: 220, stock: 5, min: 2 },
    { sku: 'IP13-DISP', brand: 'Apple', model: 'iPhone 13', category: 'Display', name: 'Pantalla iPhone 13 OLED', desc: 'Pantalla OLED 6.1" compatible con Face ID. Calidad premium.', cost: 350, price: 580, stock: 12, min: 3 },
    { sku: 'IP13-BAT', brand: 'Apple', model: 'iPhone 13', category: 'Battery', name: 'Batería iPhone 13 3227mAh', desc: 'Batería de alta capacidad. Compatible con carga inalámbrica MagSafe.', cost: 100, price: 190, stock: 18, min: 5 },
    { sku: 'IP13-PORT', brand: 'Apple', model: 'iPhone 13', category: 'Charging Port', name: 'Puerto de Carga iPhone 13 Lightning', desc: 'Módulo Lightning con flex y micrófono. Original.', cost: 55, price: 110, stock: 25, min: 5 },
    { sku: 'IP13-CAM', brand: 'Apple', model: 'iPhone 13', category: 'Camera', name: 'Cámara Trasera iPhone 13 12MP', desc: 'Módulo de cámara dual 12MP. Original con OIS.', cost: 250, price: 450, stock: 6, min: 2 },
    { sku: 'IP13-SPK', brand: 'Apple', model: 'iPhone 13', category: 'Speaker', name: 'Parlante iPhone 13', desc: 'Parlante inferior original. Sonido claro y potente.', cost: 50, price: 95, stock: 15, min: 3 },
    { sku: 'XM-RN12-DISP', brand: 'Xiaomi', model: 'Redmi Note 12', category: 'Display', name: 'Pantalla Xiaomi Redmi Note 12 AMOLED', desc: 'Pantalla AMOLED 6.67" 120Hz. Con digitalizador integrado.', cost: 180, price: 320, stock: 20, min: 5 },
    { sku: 'XM-RN12-BAT', brand: 'Xiaomi', model: 'Redmi Note 12', category: 'Battery', name: 'Batería Xiaomi Redmi Note 12 5000mAh', desc: 'Batería original 5000mAh. Carga rápida 33W.', cost: 75, price: 140, stock: 30, min: 5 },
    { sku: 'XM-RN12-PORT', brand: 'Xiaomi', model: 'Redmi Note 12', category: 'Charging Port', name: 'Puerto de Carga Redmi Note 12 USB-C', desc: 'Módulo USB-C con placa de carga. Compatible carga rápida.', cost: 30, price: 65, stock: 35, min: 5 },
    { sku: 'HW-P60-DISP', brand: 'Huawei', model: 'P60 Pro', category: 'Display', name: 'Pantalla Huawei P60 Pro OLED', desc: 'Pantalla OLED curva 6.67". Alta resolución.', cost: 320, price: 520, stock: 7, min: 2 },
    { sku: 'HW-P60-BAT', brand: 'Huawei', model: 'P60 Pro', category: 'Battery', name: 'Batería Huawei P60 Pro 4815mAh', desc: 'Batería original 4815mAh. Carga SuperCharge 88W.', cost: 95, price: 175, stock: 14, min: 3 },
    { sku: 'MOT-E13-DISP', brand: 'Motorola', model: 'Edge 30', category: 'Display', name: 'Pantalla Motorola Edge 30 pOLED', desc: 'Pantalla pOLED 6.5" 144Hz. Con marco.', cost: 200, price: 350, stock: 10, min: 3 },
    { sku: 'MOT-E13-BAT', brand: 'Motorola', model: 'Edge 30', category: 'Battery', name: 'Batería Motorola Edge 30 4020mAh', desc: 'Batería original. TurboPower 33W.', cost: 70, price: 130, stock: 18, min: 5 },
    { sku: 'GEN-ACC-CARG33', brand: 'Genérico', model: 'Universal', category: 'Accessory', name: 'Cargador Rápido 33W USB-C', desc: 'Cargador turbo 33W compatible con Samsung, Xiaomi, Motorola. Incluye cable.', cost: 35, price: 80, stock: 50, min: 10 },
    { sku: 'GEN-ACC-CABLE', brand: 'Genérico', model: 'Universal', category: 'Accessory', name: 'Cable USB-C 1m Trenzado', desc: 'Cable USB-C de 1 metro trenzado. Carga rápida y transferencia de datos.', cost: 10, price: 25, stock: 80, min: 15 },
    { sku: 'GEN-ACC-VIDTEMP', brand: 'Genérico', model: 'Universal', category: 'Accessory', name: 'Vidrio Templado Universal', desc: 'Vidrio templado 9H. Compatible con múltiples modelos.', cost: 5, price: 20, stock: 100, min: 20 },
    { sku: 'GEN-ACC-AUDIF', brand: 'Genérico', model: 'Universal', category: 'Accessory', name: 'Audífonos Bluetooth 5.3 TWS', desc: 'Audífonos inalámbricos con estuche de carga. Cancelación de ruido.', cost: 55, price: 120, stock: 25, min: 5 },
    { sku: 'GEN-TOOL-KIT', brand: 'Genérico', model: 'Universal', category: 'Tool', name: 'Kit de Herramientas para Reparación', desc: 'Kit completo con destornilladores, pinzas, espátulas y ventosa.', cost: 40, price: 90, stock: 15, min: 3 },
  ];

  products.forEach(p => {
    insertProduct.run(p.sku, p.brand, p.model, p.category, p.name, p.desc, p.cost, p.price, p.stock, p.min, 'Importadora J&V');
  });

  const insertCompat = db.prepare(
    'INSERT INTO product_compatibility (product_id, compatible_brand, compatible_model) VALUES (?, ?, ?)'
  );

  const compatibilities = [
    { product_sku: 'SAM-A54-DISP', brand: 'Samsung', model: 'Galaxy A54 5G' },
    { product_sku: 'SAM-A54-DISP', brand: 'Samsung', model: 'Galaxy A34' },
    { product_sku: 'SAM-A54-BAT', brand: 'Samsung', model: 'Galaxy A34' },
    { product_sku: 'SAM-A54-BAT', brand: 'Samsung', model: 'Galaxy A53' },
    { product_sku: 'SAM-A54-PORT', brand: 'Samsung', model: 'Galaxy A34' },
    { product_sku: 'SAM-A54-PORT', brand: 'Samsung', model: 'Galaxy A53' },
    { product_sku: 'SAM-A54-CAM', brand: 'Samsung', model: 'Galaxy A34' },
    { product_sku: 'IP13-DISP', brand: 'Apple', model: 'iPhone 14' },
    { product_sku: 'IP13-DISP', brand: 'Apple', model: 'iPhone 13 Pro' },
    { product_sku: 'IP13-BAT', brand: 'Apple', model: 'iPhone 14' },
    { product_sku: 'IP13-BAT', brand: 'Apple', model: 'iPhone 12' },
    { product_sku: 'IP13-PORT', brand: 'Apple', model: 'iPhone 14' },
    { product_sku: 'IP13-PORT', brand: 'Apple', model: 'iPhone 12' },
    { product_sku: 'XM-RN12-DISP', brand: 'Xiaomi', model: 'Redmi Note 11' },
    { product_sku: 'XM-RN12-DISP', brand: 'Xiaomi', model: 'Redmi Note 13' },
    { product_sku: 'XM-RN12-BAT', brand: 'Xiaomi', model: 'Redmi Note 11' },
    { product_sku: 'XM-RN12-BAT', brand: 'Xiaomi', model: 'Poco X5' },
    { product_sku: 'HW-P60-DISP', brand: 'Huawei', model: 'P50 Pro' },
    { product_sku: 'HW-P60-DISP', brand: 'Huawei', model: 'Mate 50' },
    { product_sku: 'HW-P60-BAT', brand: 'Huawei', model: 'P50 Pro' },
    { product_sku: 'MOT-E13-DISP', brand: 'Motorola', model: 'Edge 20' },
    { product_sku: 'MOT-E13-DISP', brand: 'Motorola', model: 'Moto G200' },
  ];

  compatibilities.forEach(c => {
    const prod = db.prepare('SELECT id FROM products WHERE sku = ?').get(c.product_sku);
    if (prod) {
      insertCompat.run(prod.id, c.brand, c.model);
    }
  });

  const customerCount = db.prepare('SELECT COUNT(*) as c FROM customers').get();
  if (customerCount.c === 0) {
    const insertCustomer = db.prepare(
      'INSERT INTO customers (phone_number, full_name, email, city, address, total_spent, total_orders) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    insertCustomer.run('59170000001', 'Carlos Gómez', 'carlos@email.com', 'Santa Cruz', 'Av. Principal #123', 1250, 3);
    insertCustomer.run('59170000002', 'María López', 'maria@email.com', 'La Paz', 'Calle Comercio #456', 850, 2);
    insertCustomer.run('59163971356', 'tiburnsin 67', '', '', '', 0, 0);
  }

  db.save();
}

function createIndexes(db) {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_phone ON whatsapp_messages(phone_number);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON whatsapp_messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_processed ON whatsapp_messages(processed);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
    CREATE INDEX IF NOT EXISTS idx_compatibility_product ON product_compatibility(product_id);
    CREATE INDEX IF NOT EXISTS idx_compatibility_brand ON product_compatibility(compatible_brand);
    CREATE INDEX IF NOT EXISTS idx_compatibility_model ON product_compatibility(compatible_model);
    CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_movements(product_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_created ON inventory_movements(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)
  `);
}

function insertDefaultSettings(db) {
  const res = db.prepare('SELECT COUNT(*) as c FROM store_settings').get();
  if (res && res.c === 0) {
    db.prepare(`
      INSERT INTO store_settings (store_name, phone, email, address, city, country, business_hours, about, currency, tax_percentage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'Mobile Parts Store',
      '+1 (555) 123-4567',
      'info@mobilepartsstore.com',
      '123 Tech Street, Suite 100',
      'San Francisco',
      'United States',
      'Mon-Fri 9:00 AM - 6:00 PM, Sat 10:00 AM - 2:00 PM',
      'We provide high-quality mobile phone spare parts for all major brands including Apple, Samsung, Xiaomi, Huawei, Oppo, Vivo, and more. Our AI-powered WhatsApp assistant is available 24/7 to help you find the right parts.',
      'USD',
      0
    );
    db.save();
  }
}

const db = await initializeDatabase();

export default db;

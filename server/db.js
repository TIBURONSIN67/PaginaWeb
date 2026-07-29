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
      ai_response TEXT DEFAULT '',
      processed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

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

  saveInterval = setInterval(() => {
    db.save();
  }, 30000);

  return db;
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

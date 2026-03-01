// migrate.js - Run this to add missing tables to the existing database
const Database = require('better-sqlite3');
const db = new Database('linear.db');

try {
    db.exec(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_read INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);
    console.log('Tables created/verified OK.');

    const adminExists = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
    if (adminExists.count === 0) {
        db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)').run('admin', 'admin123');
        console.log('Admin user created: username=admin, password=admin123');
    } else {
        console.log('Admin user already exists.');
    }

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('All tables in DB:', tables.map(t => t.name).join(', '));

} catch (err) {
    console.error('Migration error:', err.message);
}

db.close();

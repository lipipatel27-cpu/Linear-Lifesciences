const Database = require('better-sqlite3');
const db = new Database('linear.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES categories (id)
  );

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

const categoriesData = [
  {
    name: "Liver Care Support",
    description: "Advanced antioxidant and hepatoprotective blends crafted to support liver wellness and metabolic health.",
    slug: "liver-care",
    products: [
      { name: "Silymarin + L-Ornithine + B-Complex", description: "Supports liver function and detoxification." },
      { name: "Glutathione + Alpha Lipoic Acid", description: "Potent antioxidant combination for liver health." },
      { name: "Liv Support Herbal Extract Blends", description: "Natural herbal blend for liver support." }
    ]
  },
  {
    name: "Kidney Care Support",
    description: "Carefully structured nutritional support solutions for renal health and electrolyte balance.",
    slug: "kidney-care",
    products: [
      { name: "Alpha Ketoanalogue Tablets", description: "Essential amino acids for renal insufficiency." },
      { name: "Cranberry Extract", description: "Supports urinary tract health." },
      { name: "Vitamin B Complex for renal patients", description: "Tailored B-complex for kidney health." },
      { name: "Electrolyte Support Sachets", description: "Helps maintain electrolyte balance." }
    ]
  },
  {
    name: "Hair, Skin & Beauty Support",
    description: "High-bioavailability formulations designed to support healthy hair, radiant skin, and cellular rejuvenation.",
    slug: "beauty-support",
    products: [
      { name: "Biotin + Zinc + Selenium", description: "Essential nutrients for hair and nail health." },
      { name: "Glutathione + Vitamin C", description: "Promotes skin brightness and collagen production." },
      { name: "Collagen Sachets", description: "Supports skin elasticity and joint health." },
      { name: "Hair Growth Softgels", description: "Advanced formula for hair modulation." }
    ]
  },
  {
    name: "Dietary Supplements (General Wellness)",
    description: "Daily nutritional solutions designed to bridge dietary gaps and support active lifestyles.",
    slug: "general-wellness",
    products: [
      { name: "Multivitamin Tablets", description: "Comprehensive daily vitamin support." },
      { name: "Protein Powder", description: "High-quality protein for muscle repair and recovery." },
      { name: "Omega 3 Softgels", description: "Essential fatty acids for heart and brain health." },
      { name: "Immunity Boosters", description: "Supports immune system function." }
    ]
  },
  {
    name: "Vitamin Range",
    description: "Precision-formulated essential vitamins designed to support optimal physiological function.",
    slug: "vitamin-range",
    products: [
      { name: "Vitamin C", description: "Antioxidant support and immune health." },
      { name: "Vitamin D3", description: "Supports bone health and immune function." },
      { name: "B-Complex", description: "Energy production and nervous system support." },
      { name: "Vitamin E", description: "Antioxidant protection." },
      { name: "Methylcobalamin", description: "Vitamin B12 for nerve health." },
      { name: "Calcium + D3", description: "Bone strength formula." }
    ]
  },
  {
    name: "Urinary Tract Health Support",
    description: "Advanced urinary tract support formulations designed to promote comfort and urinary balance.",
    slug: "uti-support",
    products: [
      { name: "Cranberry Extract Capsules", description: "Natural support for urinary tract health." },
      { name: "D-Mannose Sachets", description: "Helps maintain a healthy urinary tract." },
      { name: "Potassium Citrate Sachets", description: "Supports urinary alkalization." }
    ]
  },
  {
    name: "Pregnancy & Women's Wellness Support",
    description: "Carefully structured prenatal and women's nutritional support formulations crafted to meet elevated nutritional requirements.",
    slug: "womens-wellness",
    products: [
      { name: "Folic Acid + DHA", description: "Essential for fetal development." },
      { name: "Iron + Folic Acid", description: "Supports blood health during pregnancy." },
      { name: "Calcium + Vitamin D3", description: "Bone support for mother and baby." },
      { name: "Prenatal Multivitamin", description: "Complete nutritional support for pregnancy." }
    ]
  },
  {
    name: "Reproductive Wellness Support",
    description: "Targeted antioxidant and micronutrient formulations designed to support reproductive health and hormonal balance.",
    slug: "reproductive-wellness",
    products: [
      { name: "Myo-Inositol + D-Chiro Inositol", description: "Supports ovarian function and hormonal balance." },
      { name: "CoQ10", description: "Antioxidant for cellular energy and reproductive health." },
      { name: "Antioxidant Fertility Blends", description: "Blend of antioxidants to support fertility." },
      { name: "Zinc + Selenium", description: "Minerals essential for reproductive health." }
    ]
  }
];

const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, description, slug) VALUES (@name, @description, @slug)');
const insertProduct = db.prepare('INSERT INTO products (category_id, name, description) VALUES (@category_id, @name, @description)');
const getCategoryId = db.prepare('SELECT id FROM categories WHERE slug = @slug');
const clearProducts = db.prepare('DELETE FROM products');
const clearCategories = db.prepare('DELETE FROM categories');

// Seed only if categories table is empty
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (catCount.count === 0) {
  const seed = db.transaction((categories) => {
    for (const cat of categories) {
      insertCategory.run(cat);
      const catId = getCategoryId.get({ slug: cat.slug }).id;
      for (const prod of cat.products) {
        insertProduct.run({ ...prod, category_id: catId });
      }
    }
  });
  seed(categoriesData);
  console.log('Database seeded successfully!');
}

// Seed default admin if not exists (username: admin, password: admin123)
const adminExists = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
if (adminExists.count === 0) {
  db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)').run('admin', 'admin123');
  console.log('Default admin created: username=admin, password=admin123');
}

module.exports = db;

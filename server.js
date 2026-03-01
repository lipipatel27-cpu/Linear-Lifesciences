cconst express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const db = require('./database');

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'linear-lifesciences-secret-2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 hour
}));

// Auth middleware
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
}

// =====================
// PUBLIC ROUTES
// =====================
app.get('/', (req, res) => {
    res.render('index', { title: 'Home | Linear Lifesciences' });
});

app.get('/about', (req, res) => {
    res.render('about', { title: 'About Us | Linear Lifesciences' });
});

app.get('/products', (req, res) => {
    try {
        const categories = db.prepare('SELECT * FROM categories').all();
        for (const category of categories) {
            category.products = db.prepare('SELECT * FROM products WHERE category_id = ?').all(category.id);
        }
        res.render('products', { title: 'Our Products | Linear Lifesciences', categories });
    } catch (err) {
        console.error(err);
        res.status(500).send('Database Error');
    }
});

app.get('/manufacturing', (req, res) => {
    res.render('manufacturing', { title: 'Manufacturing | Linear Lifesciences' });
});

app.get('/partnership', (req, res) => {
    res.render('partnership', { title: 'Partnership | Linear Lifesciences' });
});

app.get('/contact', (req, res) => {
    res.render('contact', { title: 'Contact Us | Linear Lifesciences' });
});

// Contact form submission
app.post('/contact/submit', (req, res) => {
    const { name, email, subject, message } = req.body;
    try {
        db.prepare('INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)').run(name, email, subject, message);
        res.json({ success: true, message: 'Thank you! Your message has been received.' });
    } catch (err) {
        res.json({ success: false, message: 'Error saving message.' });
    }
});

// =====================
// ADMIN ROUTES
// =====================

// Login
app.get('/admin/login', (req, res) => {
    if (req.session.isAdmin) return res.redirect('/admin/dashboard');
    res.render('admin/login', { title: 'Admin Login', error: null });
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    const admin = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
    if (admin && admin.password === password) {
        req.session.isAdmin = true;
        req.session.adminUser = admin.username;
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin/login', { title: 'Admin Login', error: 'Invalid username or password.' });
    }
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Dashboard
app.get('/admin/dashboard', requireAdmin, (req, res) => {
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    const totalMessages = db.prepare('SELECT COUNT(*) as count FROM contact_messages').get().count;
    const unreadMessages = db.prepare('SELECT COUNT(*) as count FROM contact_messages WHERE is_read = 0').get().count;
    res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        admin: req.session.adminUser,
        stats: { totalProducts, totalCategories, totalMessages, unreadMessages }
    });
});

// Products Management
app.get('/admin/products', requireAdmin, (req, res) => {
    const products = db.prepare(`
    SELECT p.*, c.name as category_name 
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY c.name, p.name
  `).all();
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.render('admin/products', { title: 'Manage Products', products, categories, admin: req.session.adminUser });
});

app.post('/admin/products/add', requireAdmin, (req, res) => {
    const { name, description, category_id } = req.body;
    db.prepare('INSERT INTO products (name, description, category_id) VALUES (?, ?, ?)').run(name, description, category_id);
    res.redirect('/admin/products');
});

app.post('/admin/products/edit/:id', requireAdmin, (req, res) => {
    const { name, description, category_id } = req.body;
    db.prepare('UPDATE products SET name = ?, description = ?, category_id = ? WHERE id = ?').run(name, description, category_id, req.params.id);
    res.redirect('/admin/products');
});

app.post('/admin/products/delete/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.redirect('/admin/products');
});

// Categories Management
app.get('/admin/categories', requireAdmin, (req, res) => {
    const categories = db.prepare(`
    SELECT c.*, COUNT(p.id) as product_count 
    FROM categories c LEFT JOIN products p ON c.id = p.category_id
    GROUP BY c.id ORDER BY c.name
  `).all();
    res.render('admin/categories', { title: 'Manage Categories', categories, admin: req.session.adminUser });
});

app.post('/admin/categories/add', requireAdmin, (req, res) => {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    try {
        db.prepare('INSERT INTO categories (name, description, slug) VALUES (?, ?, ?)').run(name, description, slug);
    } catch (e) { /* slug conflict */ }
    res.redirect('/admin/categories');
});

app.post('/admin/categories/delete/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM products WHERE category_id = ?').run(req.params.id);
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.redirect('/admin/categories');
});

// Messages
app.get('/admin/messages', requireAdmin, (req, res) => {
    const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
    db.prepare('UPDATE contact_messages SET is_read = 1').run();
    res.render('admin/messages', { title: 'Contact Messages', messages, admin: req.session.adminUser });
});

app.post('/admin/messages/delete/:id', requireAdmin, (req, res) => {
    db.prepare('DELETE FROM contact_messages WHERE id = ?').run(req.params.id);
    res.redirect('/admin/messages');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

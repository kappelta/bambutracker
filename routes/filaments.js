const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db');

// Multer config for photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Helper to get settings
async function getSettings() {
    const { rows } = await db.query('SELECT * FROM settings WHERE id = 1');
    return rows[0];
}

// Inventory list (Home)
router.get('/', async (req, res) => {
    const { search, material, status, location } = req.query;
    let query = 'SELECT * FROM filaments';
    const conditions = [];
    const params = [];

    if (search) {
        params.push(`%${search}%`);
        conditions.push(`(brand ILIKE $${params.length} OR material ILIKE $${params.length} OR color ILIKE $${params.length})`);
    }
    if (material) {
        params.push(material);
        conditions.push(`material = $${params.length}`);
    }
    if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
    }
    if (location) {
        params.push(`%${location}%`);
        conditions.push(`location ILIKE $${params.length}`);
    }

    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY updated_at DESC';

    const { rows: filaments } = await db.query(query, params);
    const settings = await getSettings();
    const { rows: materials } = await db.query('SELECT DISTINCT material FROM filaments ORDER BY material');

    res.render('inventory', { filaments, settings, materials, filters: req.query });
});

// Low stock & empty
router.get('/low', async (req, res) => {
    const settings = await getSettings();
    const threshold = settings.low_threshold;

    const { rows: lowStock } = await db.query(
        'SELECT * FROM filaments WHERE remaining > 0 AND remaining <= $1 ORDER BY remaining ASC',
        [threshold]
    );
    const { rows: empty } = await db.query(
        "SELECT * FROM filaments WHERE remaining = 0 OR status = 'empty' ORDER BY updated_at DESC"
    );

    res.render('low-stock', { lowStock, empty, settings });
});

// Add filament - photo step
router.get('/new', (req, res) => {
    res.render('add-photo');
});

// Add filament - details step
router.get('/new/details', (req, res) => {
    res.render('add-details', { photo: req.query.photo || null });
});

// Create filament
router.post('/', upload.single('photo'), async (req, res) => {
    const { brand, material, color, color_hex, remaining, total_weight, status, location, notes } = req.body;
    const photo_url = req.file ? '/uploads/' + req.file.filename : null;

    await db.query(
        `INSERT INTO filaments (brand, material, color, color_hex, remaining, total_weight, status, location, notes, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [brand, material, color, color_hex || '#F97316', remaining || 100, total_weight || 1000, status || 'sealed', location, notes, photo_url]
    );

    res.redirect('/filaments');
});

// Filament detail
router.get('/:id', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM filaments WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.redirect('/filaments');
    const settings = await getSettings();
    res.render('detail', { filament: rows[0], settings });
});

// Edit form
router.get('/:id/edit', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM filaments WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.redirect('/filaments');
    res.render('edit', { filament: rows[0] });
});

// Update filament
router.put('/:id', upload.single('photo'), async (req, res) => {
    const { brand, material, color, color_hex, remaining, total_weight, status, location, notes } = req.body;
    const photo_url = req.file ? '/uploads/' + req.file.filename : undefined;

    let query, params;
    if (photo_url) {
        query = `UPDATE filaments SET brand=$1, material=$2, color=$3, color_hex=$4, remaining=$5,
                 total_weight=$6, status=$7, location=$8, notes=$9, photo_url=$10, updated_at=NOW() WHERE id=$11`;
        params = [brand, material, color, color_hex || '#F97316', remaining, total_weight || 1000, status, location, notes, photo_url, req.params.id];
    } else {
        query = `UPDATE filaments SET brand=$1, material=$2, color=$3, color_hex=$4, remaining=$5,
                 total_weight=$6, status=$7, location=$8, notes=$9, updated_at=NOW() WHERE id=$10`;
        params = [brand, material, color, color_hex || '#F97316', remaining, total_weight || 1000, status, location, notes, req.params.id];
    }

    await db.query(query, params);
    res.redirect('/filaments/' + req.params.id);
});

// Update remaining page
router.get('/:id/remaining', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM filaments WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.redirect('/filaments');
    const settings = await getSettings();
    res.render('update-remaining', { filament: rows[0], settings });
});

// Update remaining value
router.put('/:id/remaining', async (req, res) => {
    const { remaining, status } = req.body;
    const newStatus = parseInt(remaining) === 0 ? 'empty' : (status || 'open');
    await db.query(
        'UPDATE filaments SET remaining=$1, status=$2, updated_at=NOW() WHERE id=$3',
        [remaining, newStatus, req.params.id]
    );
    res.redirect('/filaments/' + req.params.id);
});

// Restock (set to 100%)
router.put('/:id/restock', async (req, res) => {
    await db.query(
        "UPDATE filaments SET remaining=100, status='sealed', updated_at=NOW() WHERE id=$1",
        [req.params.id]
    );
    const referer = req.get('Referer') || '/filaments';
    res.redirect(referer);
});

// Delete filament
router.delete('/:id', async (req, res) => {
    await db.query('DELETE FROM filaments WHERE id = $1', [req.params.id]);
    res.redirect('/filaments');
});

module.exports = router;

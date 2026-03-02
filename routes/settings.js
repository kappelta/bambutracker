const express = require('express');
const router = express.Router();
const db = require('../db');

// Settings page
router.get('/', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM settings WHERE id = 1');
    res.render('settings', { settings: rows[0] });
});

// Update settings
router.put('/', async (req, res) => {
    const { tracking_mode, low_threshold } = req.body;
    await db.query(
        'UPDATE settings SET tracking_mode=$1, low_threshold=$2, updated_at=NOW() WHERE id=1',
        [tracking_mode, low_threshold]
    );
    res.redirect('/settings');
});

// Export data as JSON
router.get('/export', async (req, res) => {
    const { rows: filaments } = await db.query('SELECT * FROM filaments ORDER BY id');
    const { rows: settings } = await db.query('SELECT * FROM settings WHERE id = 1');
    res.setHeader('Content-Disposition', 'attachment; filename=bambutracker-export.json');
    res.json({ filaments, settings: settings[0] });
});

// Clear all data
router.delete('/clear', async (req, res) => {
    await db.query('DELETE FROM filaments');
    res.redirect('/settings');
});

module.exports = router;

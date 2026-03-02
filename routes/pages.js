const express = require('express');
const router = express.Router();
const db = require('../db');

// Welcome / Onboarding
router.get('/', (req, res) => {
    res.render('welcome');
});

// Quick Setup
router.get('/setup', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM settings WHERE id = 1');
    res.render('setup', { settings: rows[0] });
});

module.exports = router;

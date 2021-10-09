require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../database/roles');
const authorize = require('../middleware/authorize');
const homeController = require('../controllers/home');

router.get('/:langCode', async (req, res, next) => {
	const { langCode } = req.params;
	const sections = homeController.get(langCode || process.env.DEFAULT_LANGUAGE);
	res.json(sections);
});

module.exports = router;

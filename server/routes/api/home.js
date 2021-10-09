require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const homeController = require('../../controllers/home');

router.get('/', async (req, res, next) => {
	try {
		const home = await homeController.get(req.cookies.langCode);
		res.json(home);
	} catch (err) {
		next(err);
	}
});

module.exports = router;

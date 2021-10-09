require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const languageController = require('../../controllers/language');
const userController = require('../../controllers/user');

router.get('/', async (req, res, next) => {
	try {
		const languages = await languageController.getAll();
		res.json(languages);
	} catch (err) {
		next(err);
	}
});
router.get('/:langCode', async (req, res, next) => {
	try {
		const { langCode } = req.params;
		const language = await languageController.get(langCode);
		res.json(language);
	} catch (err) {
		next(err);
	}
});
router.get('/set/:langCode', async (req, res, next) => {
	try {
		const { langCode } = req.params;
		if (!langCode) throw new Error('No langCode defined');
		res.cookie('langCode', langCode, { httpOnly: true, expire: 2592000 });

		//if(id) await userController.update(id, {langCode}, langCode)
		res.json({ success: true });
	} catch (err) {
		next(err);
	}
});
router.post('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const language = await languageController.add(req.body);
		res.json(language);
	} catch (err) {
		next(err);
	}
});
router.patch('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const language = await languageController.update(req.params.id, req.body);
		res.json(language);
	} catch (err) {
		next(err);
	}
});
router.delete('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const languages = await languageController.removeAll();
		res.json(languages);
	} catch (err) {
		next(err);
	}
});
router.delete('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const language = await languageController.remove(req.params.id);
		res.json(language);
	} catch (err) {
		next(err);
	}
});

module.exports = router;

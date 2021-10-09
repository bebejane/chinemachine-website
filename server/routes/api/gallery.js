require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const galleryController = require('../../controllers/gallery');

// Galleries
router.get('/', async (req, res, next) => {
	try {
		res.json(await galleryController.getAll());
	} catch (err) {
		next(err);
	}
});
router.get('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await galleryController.get(req.params.id));
	} catch (err) {
		next(err);
	}
});
router.get('/:sectionId/:langCode', async (req, res, next) => {
	try {
		res.json(await galleryController.getBySection(req.params.sectionId, req.params.langCode));
	} catch (err) {
		next(err);
	}
});
router.get('/main/:langCode/gallery', async (req, res, next) => {
	try {
		res.json(await galleryController.getMain(req.params.langCode));
	} catch (err) {
		next(err);
	}
});
router.post('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await galleryController.add(req.body));
	} catch (err) {
		next(err);
	}
});
router.patch('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await galleryController.update(req.params.id, req.body));
	} catch (err) {
		next(err);
	}
});
router.delete('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await galleryController.removeAll());
	} catch (err) {
		next(err);
	}
});
router.delete('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await galleryController.remove(req.params.id));
	} catch (err) {
		next(err);
	}
});

module.exports = router;

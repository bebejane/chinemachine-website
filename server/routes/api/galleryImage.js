require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const galleryImageController = require('../../controllers/galleryImage');

// Gallery Images
router.get('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await galleryImageController.getAll());
	} catch (err) {
		next(err);
	}
});
router.get('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await galleryImageController.get(req.params.id));
	} catch (err) {
		next(err);
	}
});
router.post('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await galleryImageController.add(req.body));
	} catch (err) {
		next(err);
	}
});
router.patch('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await galleryImageController.update(req.params.id, req.body));
	} catch (err) {
		next(err);
	}
});
router.delete('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await galleryImageController.removeAll());
	} catch (err) {
		next(err);
	}
});
router.delete('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await galleryImageController.remove(req.params.id));
	} catch (err) {
		next(err);
	}
});

module.exports = router;

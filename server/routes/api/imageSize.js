require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const imageSizeController = require('../../controllers/imageSize');

router.get('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const images = await imageSizeController.getAll();
		res.json(images);
	} catch (err) {
		next(err);
	}
});
router.get('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const image = await imageSizeController.get(req.params.id);
		res.json(image);
	} catch (err) {
		next(err);
	}
});

router.patch('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const image = await imageSizeController.update(req.params.id, req.body);
		res.json(images);
	} catch (err) {
		next(err);
	}
});
router.delete('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const images = await imageSizeController.removeAll();
		res.json(images);
	} catch (err) {
		next(err);
	}
});

module.exports = router;

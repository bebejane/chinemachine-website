require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const infoController = require('../../controllers/info');

router.get('/:sectionId/:langCode', async (req, res, next) => {
	try {
		const info = await infoController.getBySection(req.params.sectionId, req.params.langCode);
		res.json(info);
	} catch (err) {
		next(err);
	}
});

router.get('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const info = await infoController.getAll();
		res.json(info);
	} catch (err) {
		next(err);
	}
});
router.get('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const info = await infoController.get(req.params.id);
		res.json(info);
	} catch (err) {
		next(err);
	}
});

router.post('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const info = await infoController.add(req.body);
		res.json(info);
	} catch (err) {
		next(err);
	}
});
router.patch('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const info = await infoController.update(req.params.id, req.body);
		res.json(info);
	} catch (err) {
		next(err);
	}
});
router.delete('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const info = await infoController.removeAll();
		res.json(info);
	} catch (err) {
		next(err);
	}
});
router.delete('/:sectionId', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const info = await infoController.removeBySection(req.params.sectionId);
		res.json(info);
	} catch (err) {
		next(err);
	}
});
router.delete('/:sectionId/:langCode', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const info = await infoController.removeBySection(req.params.sectionId, req.params.langCode);
		res.json(info);
	} catch (err) {
		next(err);
	}
});

module.exports = router;

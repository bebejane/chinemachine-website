require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const sectionController = require('../../controllers/section');

router.get('/', async (req, res, next) => {
	try {
		const sections = await sectionController.getAll(req.cookies.langCode || process.env.DEFAULT_LANGUAGE);
		res.json(sections);
	} catch (err) {
		next(err);
	}
});
router.get('/:id', async (req, res, next) => {
	try {
		const section = await sectionController.get(req.params.id);
		res.json(section);
	} catch (err) {
		next(err);
	}
});
router.get('/:id/:langCode', async (req, res, next) => {
	try {
		const section = await sectionController.getData(req.params.id, req.params.langCode);
		res.json(section);
	} catch (err) {
		next(err);
	}
});

router.post('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const section = await sectionController.add(req.body);
		res.json(section);
	} catch (err) {
		next(err);
	}
});
router.patch('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	const sections = req.body;
	if (!sections || !Array.isArray(sections)) return next(new Error('Invalid data'));
	try {
		const section = await sectionController.updateMany(sections);
		res.json(section);
	} catch (err) {
		next(err);
	}
});
router.patch('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const section = await sectionController.update(req.params.id, req.body);
		res.json(section);
	} catch (err) {
		next(err);
	}
});

router.delete('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const section = await sectionController.remove(req.params.id);
		res.json(section);
	} catch (err) {
		next(err);
	}
});
module.exports = router;

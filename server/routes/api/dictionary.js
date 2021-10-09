require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const dictionaryController = require('../../controllers/dictionary');
const fs = require('fs')

router.get('/', async (req, res, next) => {
	try {
		const dictionaries = await dictionaryController.getDictionary(req.cookies.langCode);
		res.json(dictionaries);
	} catch (err) {
		next(err);
	}
});
router.get('/id/:id', async (req, res, next) => {
	try {
		const dictionary = await dictionaryController.get(req.params.id);
		res.json(dictionary);
	} catch (err) {
		next(err);
	}
});
router.get('/all', async (req, res, next) => {
	try {
		const dictionary = await dictionaryController.getAll();
		res.json(dictionary);
	} catch (err) {
		next(err);
	}
});
router.post('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const dictionary = await dictionaryController.add(req.body);
		res.json(dictionary);
	} catch (err) {
		next(err);
	}
});
router.patch('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const dicts = req.body;
		const items = await Promise.all(dicts.map((d) => dictionaryController.update(d._id, d)));
		res.json(items);
	} catch (err) {
		next(err);
	}
});
router.patch('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const dictionary = await dictionaryController.update(req.body._id, req.body);
		res.json(dictionary);
	} catch (err) {
		next(err);
	}
});
router.delete('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const dictionaries = await dictionaryController.removeAll();
		res.json(dictionaries);
	} catch (err) {
		next(err);
	}
});
router.delete('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const dictionary = await dictionaryController.remove(req.params.id);
		res.json(dictionary);
	} catch (err) {
		next(err);
	}
});

module.exports = router;

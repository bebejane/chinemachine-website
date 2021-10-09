require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const storeController = require('../../controllers/store');

router.get('/', async (req, res, next) => {
	try {
		const store = await storeController.getAll();
		res.json(store);
	} catch (err) {
		next(err);
	}
});
router.get('/:id', async (req, res, next) => {
	try {
		const store = await storeController.get(req.params.id);
		res.json(store);
	} catch (err) {
		next(err);
	}
});
router.post('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const store = await storeController.add(req.body);
		res.json(store);
	} catch (err) {
		next(err);
	}
});
router.patch('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const store = await storeController.update(req.params.id, req.body);
		res.json(store);
	} catch (err) {
		next(err);
	}
});
router.delete('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const stores = await storeController.removeAll();
		res.json(stores);
	} catch (err) {
		next(err);
	}
});
router.delete('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const store = await storeController.remove(req.params.id);
		res.json(store);
	} catch (err) {
		next(err);
	}
});
module.exports = router;

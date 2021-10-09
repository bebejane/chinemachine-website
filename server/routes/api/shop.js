require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const apicache = require('apicache');
const cache = apicache.middleware;
const etsyCache = cache('5 minutes');
const shopController = require('../../controllers/shop');

router.get('/latest', async (req, res, next) => {
	try {
		const products = await shopController.latest();
		res.json(products);
	} catch (err) {
		next(err);
	}
});
router.get('/latest/page/:page', async (req, res, next) => {
	try {
		const products = await shopController.latest(req.params.page);
		res.json(products);
	} catch (err) {
		next(err);
	}
});

router.get('/', etsyCache, async (req, res, next) => {
	try {
		const products = await shopController.getAll();
		res.json(products);
	} catch (err) {
		next(err);
	}
});

router.get('/product', authorize(Roles.ADMINISTRATOR), etsyCache, async (req, res, next) => {
	try {
		const products = await shopController.getAll();
		res.json(products);
	} catch (err) {
		next(err);
	}
});
router.get('/product/:id', etsyCache, async (req, res, next) => {
	try {
		const product = await shopController.get(req.params.id);
		res.json(product);
	} catch (err) {
		next(err);
	}
});
router.get('/product/:id/images', etsyCache, async (req, res, next) => {
	try {
		const images = await shopController.getImages(req.params.id);
		res.json(images);
	} catch (err) {
		next(err);
	}
});

router.get('/product/page/:page', async (req, res, next) => {
	console.log('get. by page', req.params.page);
	try {
		const products = await shopController.getAll(req.params.page);
		res.json(products);
	} catch (err) {
		next(err);
	}
});
router.delete('/cache', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		apicache.clear();
		res.json({ cleared: true });
	} catch (err) {
		next(err);
	}
});
router.post('/product', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const products = await shopController.addMany(req.body);
		res.json(products);
	} catch (err) {
		next(err);
	}
});
router.patch('/product/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const products = await shopController.update(req.params.id, req.body);
		res.json(products);
	} catch (err) {
		next(err);
	}
});
router.delete('/product', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const products = await shopController.removeAll();
		res.json(products);
	} catch (err) {
		next(err);
	}
});
module.exports = router;

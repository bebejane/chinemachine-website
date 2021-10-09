const config = require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const moment = require('moment');
const apicache = require('apicache');
const cache = apicache.middleware;
const erplyCache = cache('1 minute');

const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const erplyController = require('../../controllers/erply');

router.get('/today', async (req, res, next) => {
	const result = await erplyController.getSales(new Date());
	res.json(result);
});
router.get('/today/:warehouseId', async (req, res, next) => {
	const result = await erplyController.getSales(new Date(), req.params.warehouseId);
	res.json(result);
});
router.get('/sales', async (req, res, next) => {
	const result = await erplyController.getSales(new Date());
	res.json(result);
});

router.get('/sales/:warehouseId/:year/:month', erplyCache, async (req, res, next) => {
	const date = moment().year(req.params.year).month(req.params.month).date(1);
	const dateTo = moment(date).date(date.daysInMonth());
	const result = await erplyController.getSalesDocuments(date.toDate(), dateTo.toDate(), req.params.warehouseId);
	res.json(result);
});
router.get('/sales/:warehouseId/:year/:month/:date', erplyCache, async (req, res, next) => {
	const date = moment().year(req.params.year).month(req.params.month).date(req.params.date).toDate();
	const result = await erplyController.getSalesDocuments(date, date, req.params.warehouseId);
	res.json(result);
});
router.get('/sales/report/:warehouseId/:year/:month/:date', erplyCache, async (req, res, next) => {
	const date = moment().year(req.params.year).month(req.params.month).date(req.params.date).toDate();
	try {
		const result = await erplyController.getSales(date, req.params.warehouseId);
		res.json(result);
	} catch (err) {
		next(err);
	}
});

/// REFRESH
router.get('/sales/:warehouseId/:year/:month/:date/refresh', async (req, res, next) => {
	const date = moment().year(req.params.year).month(req.params.month).date(req.params.date).toDate();
	const result = await erplyController.getSalesDocuments(date, date, req.params.warehouseId);
	res.json(result);
});
router.get('/sales/report/:warehouseId/:year/:month/:date/refresh', async (req, res, next) => {
	const date = moment().year(req.params.year).month(req.params.month).date(req.params.date).toDate();
	try {
		const result = await erplyController.getSales(date, req.params.warehouseId);
		res.json(result);
	} catch (err) {
		next(err);
	}
});
router.get('/stores', erplyCache, async (req, res, next) => {
	const result = await erplyController.getStores();
	res.json(result);
});
router.get('/payments', erplyCache, async (req, res, next) => {
	const result = await erplyController.getPayments();
	res.json(result);
});
router.get('/clockins', erplyCache, async (req, res, next) => {
	const result = await erplyController.getClockins();
	res.json(result);
});

router.post('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		//const info = await infoController.add(req.body)
		//res.json(info)
	} catch (err) {
		next(err);
	}
});
module.exports = router;

require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const Appointment = require('../../models/appointment');

router.get('/:year/:month', (req, res, next) => {
	if (isNaN(req.params.year) || isNaN(req.params.month)) throw new Error('Invalid year or month');

	const year = parseInt(req.params.year);
	const month = parseInt(req.params.month);
	const startDate = new Date(year, month, 1, 0);
	const endDate = new Date(year, month + 1, 0, 23, 59, 59);
	//console.log(startDate.getTime(), new Date(startDate.getTime()))
	//console.log(endDate.getTime(), new Date(endDate.getTime()))
	Appointment.find()
		.where('userId')
		.exists(false)
		.where('startTime')
		.gte(startDate.getTime())
		.where('endTime')
		.lte(endDate.getTime())
		.populate('user')
		.populate('store')
		.sort('startTime')
		.then((data) => res.json(data))
		.catch(next);
});
router.get('/:year/:month/:date', (req, res, next) => {
	if (isNaN(req.params.year) || isNaN(req.params.month) || isNaN(req.params.date))
		throw new Error('Invalid year or month or date');

	const year = parseInt(req.params.year);
	const month = parseInt(req.params.month);
	const date = parseInt(req.params.date);
	const startDate = new Date(year, month, date, 0, 0, 0);
	const endDate = new Date(year, month, date, 23, 59, 59);
	//console.log(startDate.getTime(), new Date(startDate.getTime()))
	//console.log(endDate.getTime(), new Date(endDate.getTime()))

	Appointment.find()
		.where('userId')
		.exists(false)
		.where('startTime')
		.gte(startDate.getTime())
		.where('endTime')
		.lte(endDate.getTime())
		.populate('user')
		.populate('store')
		.sort('startTime')
		.then((data) => res.json(data))
		.catch(next);
});

router.patch('/:id', authorize(Roles.USER), (req, res, next) => {
	Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
		.then((doc) => {
			return doc.populate('user').populate('store').execPopulate();
		})
		.then((data) => res.json(data))
		.catch(next);
});
module.exports = router;

require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const Errors = require('../../common/errors');
const { Roles, isRoleAuthorized, isAdministrator } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const appointmentController = require('../../controllers/appointment');
const userController = require('../../controllers/user');

router.get('/user/:userId', authorize(Roles.USER), async (req, res, next) => {
	const { userId } = req.params;

	try {
		if (req.user.id !== userId && !isAdministrator(req.user.role))
			throw Errors.create(Errors.UNAUTHORIZED_ACCESS, req.cookies.langCode);
		res.json(await appointmentController.getByUser(userId));
	} catch (err) {
		next(err);
	}
});
router.post('/user/:userId/appointment/:appointmentId/cancel', authorize(Roles.USER), async (req, res, next) => {
	const { userId, appointmentId } = req.params;
	try {
		if (req.user.id !== userId && !isAdministrator(req.user.role))
			throw Errors.create(Errors.UNAUTHORIZED_ACCESS, req.cookies.langCode);

		await appointmentController.cancel(appointmentId, req.cookies.langCode);
		res.json({ success: true });
	} catch (err) {
		next(err);
	}
});
router.post('/user/:userId/appointment/:appointmentId/book', authorize(Roles.USER), async (req, res, next) => {
	const { userId, appointmentId } = req.params;
	try {
		if (req.user.id !== userId && !isAdministrator(req.user.role))
			throw Errors.create(Errors.UNAUTHORIZED_ACCESS, req.cookies.langCode);

		res.json(await appointmentController.book(userId, appointmentId, req.cookies.langCode));
	} catch (err) {
		next(err);
	}
});
router.post(
	'/user/:userId/appointment/:appointmentId/bookinternal',
	authorize([Roles.ADMINISTRATOR, Roles.MANAGER]),
	async (req, res, next) => {
		const { userId, appointmentId } = req.params;
		try {
			res.json(await appointmentController.book(userId, appointmentId, req.cookies.langCode, true));
		} catch (err) {
			next(err);
		}
	}
);
router.get('/:year/:month', async (req, res, next) => {
	const { year, month } = req.params;
	try {
		res.json(await appointmentController.getAllByMonth(year, month));
	} catch (err) {
		next(err);
	}
});
router.get('/:year/:month/:date', async (req, res, next) => {
	const { year, month, date } = req.params;
	try {
		res.json(await appointmentController.getAllByDate(parseInt(year), parseInt(month), parseInt(date)));
	} catch (err) {
		next(err);
	}
});
router.get('/:year/:month/store/:storeId', async (req, res, next) => {
	const { year, month } = req.params;
	try {
		res.json(await appointmentController.getByMonth(year, month, req.params.storeId));
	} catch (err) {
		next(err);
	}
});
router.get('/:year/:month/:date/store/:storeId', async (req, res, next) => {
	const { year, month, date } = req.params;
	try {
		res.json(
			await appointmentController.getByDate(parseInt(year), parseInt(month), parseInt(date), req.params.storeId)
		);
	} catch (err) {
		next(err);
	}
});

router.get('/util/byweek/:year/:week', authorize([Roles.MANAGER, Roles.ADMINISTRATOR]), async (req, res, next) => {
	const { year, month, week } = req.params;
	try {
		res.json(await appointmentController.getAllByWeek(year, week));
	} catch (err) {
		next(err);
	}
});

router.get('/', authorize([Roles.EMPLOYEE, Roles.MANAGER, Roles.ADMINISTRATOR]), async (req, res, next) => {
	try {
		res.json(await appointmentController.getAll());
	} catch (err) {
		next(err);
	}
});
router.get('/:id', authorize([Roles.EMPLOYEE, Roles.MANAGER, Roles.ADMINISTRATOR]), async (req, res, next) => {
	try {
		res.json(await appointmentController.get(req.params.id));
	} catch (err) {
		next(err);
	}
});
router.post('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await appointmentController.add(req.body));
	} catch (err) {
		next(err);
	}
});
router.patch('/:id', authorize([Roles.ADMINISTRATOR]), async (req, res, next) => {
	try {
		const appointment = await appointmentController.get(req.params.id);
		res.json(await appointmentController.book(req.user.id, req.params));
	} catch (err) {
		next(err);
	}
});
router.delete('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await appointmentController.removeAll());
	} catch (err) {
		next(err);
	}
});
router.delete('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		res.json(await appointmentController.remove(req.params.id));
	} catch (err) {
		next(err);
	}
});
module.exports = router;

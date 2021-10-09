const express = require('express');
const router = express.Router();
const Errors = require('../../common/errors');
const { Roles, isAdministrator } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const userController = require('../../controllers/user');
const appointmentController = require('../../controllers/appointment');

router.get('/', authorize([Roles.MANAGER, Roles.ADMINISTRATOR]), async (req, res, next) => {
	try {
		const users = await userController.getAll();
		res.json(users);
	} catch (err) {
		next(err);
	}
});
router.get('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const user = await userController.get(req.params.id, req.cookies.langCode);
		res.json(user);
	} catch (err) {
		next(err);
	}
});
router.post('/', authorize([Roles.MANAGER, Roles.ADMINISTRATOR]), async (req, res, next) => {
	try {
		const user = await userController.add(req.body, req.cookies.langCode);
		res.json(user);
	} catch (err) {
		next(err);
	}
});
router.patch('/:userId', authorize([Roles.USER, Roles.MANAGER, Roles.ADMINISTRATOR]), async (req, res, next) => {
	try {
		const { userId } = req.params;
		if (req.user.id !== userId && !isAdministrator(req.user.role))
			throw Errors.create(Errors.UNAUTHORIZED_ACCESS, req.cookies.langCode);

		const updatedUser = {
			...req.body,
			role: isAdministrator(req.user.role) ? req.body.role : undefined,
		};
		const user = await userController.update(userId, updatedUser, req.cookies.langCode);
		res.json(user);
	} catch (err) {
		next(err);
	}
});
router.delete('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const users = await userController.removeAll();
		res.json(users);
	} catch (err) {
		next(err);
	}
});
router.delete('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const user = await userController.remove(req.params.id, req.cookies.langCode);
		res.json(user);
	} catch (err) {
		next(err);
	}
});
router.get('/util/search/:term', authorize([Roles.MANAGER, Roles.ADMINISTRATOR]), async (req, res, next) => {
	try {
		const users = await userController.search(req.params.term);
		res.json(users);
	} catch (err) {
		next(err);
	}
});
module.exports = router;

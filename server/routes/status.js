const express = require('express');
const router = express.Router();
const User = require('../models/user');
const userController = require('../controllers/user');
const Errors = require('../common/errors');

router.get('/', async (req, res, next) => {
	try {
		if (!req.user) throw Errors.create(Errors.UNAUTHORIZED_ACCESS, req.cookies.langCode);

		const user = await userController.get(req.user.id);
		res.json(user);
	} catch (err) {
		next(err);
	}
});
module.exports = router;

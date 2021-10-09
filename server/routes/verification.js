const config = require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const Errors = require('../common/errors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Roles } = require('../database/roles');
const User = require('../models/user');
const userController = require('../controllers/user');

// Verfication
router.post('/signup', async (req, res, next) => {
	try {
		const { firstName, lastName, email, email2, password, password2, phone } = req.body;
		const { langCode } = req.cookies;
		const user = await userController.add({ firstName, lastName, email, email2, password, password2, phone }, langCode);
		res.json(user);
	} catch (err) {
		next(err);
	}
});
router.post('/login', async (req, res, next) => {
	const { langCode } = req.cookies;

	if (!req.body || !req.body.email || !req.body.password) return next(Errors.create(Errors.INVALID_LOGIN, langCode));

	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email });

		if (!user) throw Errors.create(Errors.USER_NOT_FOUND, langCode);

		if (!user.activated) throw Errors.create(Errors.USER_NOT_ACTIVATED, langCode);

		try {
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) throw Errors.create(Errors.PASSWORD_INCORRECT, langCode);
		} catch (err) {
			console.error(err);
			throw Errors.create(Errors.PASSWORD_INCORRECT, langCode, err);
		}

		const payload = {
			id: user._id,
			name: user.firstName + ' ' + user.lastName,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			langCode: user.langCode,
			role: user.role,
		};
		try {
			const token = await jwt.sign(payload, process.env.JWT_PRIVATE_KEY, { expiresIn: 2592000 });
			res.cookie('token', token, { httpOnly: true, expiresIn: 3600 * 24 * 365 }).json({
				_id: user._id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				role: user.role,
				activated: user.activated,
				langCode: user.langCode,
				token: 'Bearer ' + token,
			});
		} catch (err) {
			console.error(err);
			throw Errors.create(Errors.FAILED_TO_SIGN_TOKEN, langCode, err);
		}
	} catch (err) {
		next(err);
	}
});
router.post('/logout', (req, res) => {
	res.clearCookie('token');
	res.json({ success: true });
});
router.get('/logout', (req, res) => {
	res.clearCookie('token');
	res.redirect(process.env.APP_ENDPOINT);
});
router.get('/verify', async (req, res, next) => {
	next(Errors.create(Errors.INVALID_SECURITY_CODE, req.cookies.langCode));
});
router.get('/verify/:tokenOrCode', async (req, res, next) => {
	const { tokenOrCode } = req.params;

	try {
		console.log('verify user', tokenOrCode);
		await userController.verify(tokenOrCode, req.cookies.langCode);
		res.json({ success: true });
	} catch (err) {
		next(err);
	}
});
router.get('/reverify', async (req, res, next) => {
	next(Errors.create(Errors.INVALID_EMAIL, req.cookies.langCode));
});
router.get('/reverify/:email', async (req, res, next) => {
	const { email } = req.params;

	console.log('request re-verify', email);

	try {
		const user = await userController.reverify(email, req.cookies.langCode);
		if (!user) throw Errors.create(Errors.USER_NOT_FOUND, req.cookies.langCode);

		res.json({ success: true, user });
	} catch (err) {
		next(err);
	}
});
router.get('/reset', async (req, res, next) => {
	return next(new Error('E-mail address invalid'));
});
router.get('/reset/:email', async (req, res, next) => {
	const { email } = req.params;

	if (!email) return next(Errors.create(Errors.INVALID_EMAIL, req.cookies.langCode));

	try {
		const user = await userController.requestPasswordReset(email, req.cookies.langCode);
		if (!user) throw Errors.create(Errors.USER_NOT_FOUND, req.cookies.langCode);

		res.json({ success: true });
	} catch (err) {
		next(err);
	}
});
router.post('/update', async (req, res, next) => {
	const { token, password, password2 } = req.body;
	try {
		const user = await userController.updatePassword(token, password, password2, req.cookies.langCode);
		if (!user) throw Errors.create(Errors.USER_NOT_FOUND, req.cookies.langCode);

		res.json({ success: true });
	} catch (err) {
		next(err);
	}
});
router.get('/test', async (req, res, next) => {
	res.json({ test: true });
});

module.exports = router;

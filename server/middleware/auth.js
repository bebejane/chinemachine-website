const jwt = require('jsonwebtoken');
const dotnev = require('dotenv').config();
const Errors = require('../common/errors');

const auth = (req, res, next) => {
	const token = req.cookies ? req.cookies.token : undefined;
	const langCode = req.cookies && req.cookies.langCode ? req.cookies.langCode : process.env.DEFAULT_LANGUAGE;

	if (!token) return res.status(401).json({ message: Errors.translate(Errors.ACCESS_DENIED, langCode) });
	try {
		const decoded = jwt.verify(token, process.env.JWT_PRIVATE_KEY, { complete: true });
		req.user = decoded.payload;
		next();
	} catch (err) {
		res.clearCookie('token');
		return res.status(400).json({ message: Errors.translate(Errors.LOGIN_EXPIRED, langCode) });
	}
};
module.exports = auth;

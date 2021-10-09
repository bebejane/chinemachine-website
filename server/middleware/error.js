require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });

module.exports = (err, req, res, next) => {
	const { langCode } = req.cookies;
	const errors = [];
	let message;

	if (err && err.internalError && err.messages) message = err.messages[langCode] || err.messages['en'];
	else if (err) message = err.message || err.toString();
	else message = 'Unknown Error';

	if (err.errors && typeof err.errors === 'object') {
		// DB errors
		Object.keys(err.errors).forEach((k) => {
			if (err.errors[k].properties) errors.push(err.errors[k].properties.reason || err.errors[k].properties.message);
		});
		if (errors.length) message = errors.join(', ');
	}
	res.status(res.get('status') || 422).send({ message, errors });
	console.error('\x1b[31m', message);

	if (process.env.NODE_ENV === 'development') console.log(err);
};

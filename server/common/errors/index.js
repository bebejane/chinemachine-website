const codes = require('./codes.json');
const create = (err, langCode) => {
	const code = typeof err === 'object' ? err.code : err;
	const error = codes[Object.keys(codes).filter((k) => codes[k].code === code)[0]];
	let e;

	if (!error) e = new Error('Unknown error');
	else if (!error.message[langCode] && error.message['en']) {
		console.log('missing translation', code, langCode);
		e = new Error(error.message['en']);
		langCode = 'en';
	} else e = new Error(error.message[langCode]);

	e.code = code;
	e.langCode = langCode;
	e.internalError = true;
	e.messages = error.message;
	return e;
};
const translate = (err, langCode) => {
	return create(err, langCode).message;
};
module.exports = {
	...codes,
	create,
	translate,
};

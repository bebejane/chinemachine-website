const config = require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });

module.exports = (req, res, next) => {
	const params = Object.keys(req.params).length ? req.params : undefined;
	const body = Object.keys(req.body).length ? req.body : undefined;

	if (process.env.NODE_ENV === 'development') {
		console.log(req.method, req.path);
	}

	//if(params) console.log(req.params)
	//if(body) console.log(req.body)
	next();
};

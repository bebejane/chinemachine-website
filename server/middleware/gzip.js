const gzip = (req, res, next) => {
	//return next()
	console.log('gzip', req.url);
	const contentType = req.url.endsWith('.js')
		? 'application/javascript'
		: req.url.endsWith('.css')
		? 'text/css'
		: 'text/html';
	req.url = req.url + '.gz';
	res.set('Content-Encoding', 'gzip');
	res.set('Content-Type', 'application/javascript');

	next();
};

module.exports = gzip;

const compression = require('compression');

const shouldCompress = (req, res) => {
	if (req.headers['x-no-compression']) return false;
	return compression.filter(req, res);
};

module.exports = compression({ filter: shouldCompress });

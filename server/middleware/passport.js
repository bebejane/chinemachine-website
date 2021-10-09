const passport = require('passport');
module.exports = (req, res, next) => {
	passport.initialize();
	require('../config/passport')(passport);
	next();
};

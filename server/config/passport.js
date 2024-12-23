const config = require('dotenv').config({
	silent: process.env.NODE_ENV === 'production',
});
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');
const User = mongoose.model('User');
const opts = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: process.env.JWT_PRIVATE_KEY,
};

module.exports = (passport) => {
	passport.use(
		new JwtStrategy(opts, (jwt_payload, done) => {
			User.findById(jwt_payload.id)
				.then((user) => {
					if (user) return done(null, user);
					return done(null, false);
				})
				.catch((err) => console.log(err));
		})
	);
};

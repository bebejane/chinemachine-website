const mongoose = require('mongoose');
const { Roles } = require('../database/roles');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
	firstName: {
		type: String,
		required: [true, 'Invalid first name'],
	},
	lastName: {
		type: String,
		required: [true, 'Invalid last name'],
	},
	email: {
		type: String,
		validate: {
			validator: (email) =>
				new Promise((resolve, reject) => {
					User.exists({ email }, (err, exists) => {
						if (exists || err) reject(err || 'User already exist!');
						else resolve();
					});
				}),
		},
		match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email address'],
		required: [true, 'Invalid email address'],
	},
	phone: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		//match:[/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, 'Invalid password, must be minimum eight characters, at least one letter and one number'],
		required: [true, 'Invalid password, must be minimum eight characters, at least one letter and one number'],
	},
	date: {
		type: Date,
		default: Date.now,
	},
	role: {
		type: String,
		default: 'USER',
		required: true,
	},
	activated: {
		type: Boolean,
		required: true,
		default: false,
	},
	temporaryToken: {
		type: String,
		required: false,
	},
	temporaryCode: {
		type: Number,
		required: false,
	},
});

UserSchema.pre('remove', function (next) {
	if (this.role === Roles.ROOT) return next('Cant remove rooooot!');
	next();
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);
module.exports = User;

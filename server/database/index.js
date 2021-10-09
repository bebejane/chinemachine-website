const config = require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const { Roles } = require('./roles');
const mongoose = require('mongoose');
const dictionaryController = require('../controllers/dictionary');
const userController = require('../controllers/user');
const User = require('../models/user');
const Appointment = require('../models/appointment');
const Language = require('../models/language');
const Dictionary = require('../models/language');
const bcrypt = require('bcryptjs');

const mongooseOptions = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
	useCreateIndex: true,
};

const databaseConnected = async () => {
	console.log('db connected successfully');

	const english = await Language.findOne({ langCode: 'en' });
	const french = await Language.findOne({ langCode: 'fr' });

	if (!english) {
		await Language.create({ langCode: 'en', name: 'English' });
		console.log('added english');
	} else console.log('english is available');
	if (!french) {
		await Language.create({ langCode: 'fr', name: 'Française' });
		console.log('added french');
	} else console.log('french is available');

	const rootUser = await User.findOne({ email: process.env.ROOT_USER_EMAIL });

	if (!rootUser) {
		await userController.add(
			{
				email: process.env.ROOT_USER_EMAIL,
				password: process.env.ROOT_USER_PASSWORD,
				role: Roles.ROOT,
				firstName: 'ROOT',
				lastName: 'root',
				phone: '+491768082334',
				activated: true,
			},
			'en',
			{ noEmail: true }
		);
		console.log('set', process.env.ROOT_USER_EMAIL, 'to ROOT');
	}
	/*
    const users = await User.find({}).lean()
    if(users){
        console.log('---------- USERS -------------')
        users.forEach((u)=>console.log(u.email, u.role, 'ACTIVE=', u.activated))//, u.temporaryToken))
        console.log('------------------------------')
    }
    */
	return Promise.resolve();
};
const databaseError = async (err) => {
	console.log('Failed to connect to database');
	console.error(err);
};

mongoose.Promise = global.Promise;

module.exports = {
	connect: () => {
		console.log('connecting to db...');
		return mongoose
			.connect(process.env.MONGODB_URI, mongooseOptions)
			.then(async () => {
				await databaseConnected();
				return mongoose;
			})
			.catch((err) => {
				databaseError(err);
				throw err;
			});
	},
	Roles,
};

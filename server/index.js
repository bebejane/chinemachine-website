const config = require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const helmet = require('helmet');
const db = require('./database');
const authorize = require('./middleware/authorize');
const Util = require('./helpers/util');
const Errors = require('./common/errors');
const { Roles, isRoleAuthorized } = require('./database/roles');
const { testApi, checkErrors } = require('./test');
const middleware = require('./middleware');
const compression = require('compression');
const routes = require('./routes');
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;
const imageController = require('./controllers/image');
const sectionController = require('./controllers/section');
const appointmentController = require('./controllers/appointment');
const shopController = require('./controllers/shop');
const userController = require('./controllers/user');
const moment = require('moment-timezone');

const start = async () => {
	console.log('Server running on port', port);
	console.log('NODE_ENV=', process.env.NODE_ENV);
	refreshShopProducts();
	
};
const connectDatabase = () => {
	return db.connect().then((mongoose) => {
		return mongoose;
	});
};
const connectServer = () => {
	return new Promise((resolve, reject) => {
		app.use(middleware.compression);
		app.use(express.static(process.env.NODE_ENV === 'production' ? 'server/build' : 'server/public/'));
		app.use(middleware.cookieParser);
		app.use(middleware.bodyParser);
		app.use(middleware.bodyParserJSON);
		app.use(middleware.cors);
		app.use(middleware.log);
		app.use(middleware.passport);
		app.use('/verification', routes.verification);
		app.use('/appointment', routes.appointment);
		app.use('/home', routes.home);
		app.use('/api', routes.api);
		app.use('/status', middleware.auth, routes.status);
		app.get('*', (req, res) => {
			res.sendFile(path.join(__dirname + '/build/index.html'));
		});
		app.use(middleware.error);
		app.listen(port, () => resolve(port));
	});
};

const refreshShopProducts = () => {
	setInterval(async () => {
		try {
			console.log('Refreshing Etsy products');
			const count = await shopController.refreshEtsyProducts();
			console.log('Updated', count, 'products');
		} catch (err) {
			console.error('Failed to refresh Etsy products');
			console.error(err);
		}
	}, 60 * 1000 * 30); // Update every 30 minutes
};
connectServer()
	.then(connectDatabase)
	.then(() => start())
	.catch((err) => {
		console.log('ERROR STARTIN UP!');
		console.error(err);
	});

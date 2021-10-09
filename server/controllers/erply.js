const dotnev = require('dotenv').config();
const Errors = require('../common/errors');
const https = require('https');
const ObjectId = require('mongoose').Types.ObjectId;
const moment = require('moment');
const Erply = require('../helpers/ERPLY');
const erply = new Erply(process.env.ERPLY_USER, process.env.ERPLY_PASSWORD, process.env.ERPLY_CODE, 1); // 783 " 355038"
let ERPLY_INIT = false;

const init = () => {
	if (ERPLY_INIT) return Promise.resolve();

	ERPLY_INIT = false;

	return new Promise((resolve, reject) => {
		erply.init((err, data) => {
			//console.log(data)
			if (err) reject(err);
			else {
				console.log('ERPLY init done');
				ERPLY_INIT = true;
				resolve(data);
			}
		});
	});
};

const erplyRequest = async (func) => {
	const args = arguments;
	await init();
	erply[func].apply(null, Array.prototype.slice.call(args, 0));
};

const getPayments = async (date) => {
	await init();
	// const payments = await erplyRequest('getPayments', date, ()=>{})
	return new Promise((resolve, reject) => {
		erply.getPayments(date, function (err, data) {
			if (err) reject(err);
			else resolve(data);
		});
	});
};

const getSalesDocuments = async (date, dateTo, warehouseId = 1) => {
	await init();
	return new Promise((resolve, reject) => {
		erply.getSalesDocuments(date, dateTo, parseInt(warehouseId), async function (err, data) {
			if (err) reject(err);
			else {
				data.clockins = (await getClockins(date, warehouseId)) || [];
				data.clockins = data.clockins.map((c) => {
					return {
						...c,
						employee: erply.ERPLY_EMPLOYEES.filter((e) => parseInt(e.employeeID) === parseInt(c.employeeID))[0],
					};
				});
				resolve(data);
			}
		});
	});
};
const getSales = async (date, warehouseId) => {
	await init();
	return new Promise((resolve, reject) => {
		erply.getSales(date, parseInt(warehouseId), async function (err, data) {
			if (err) reject(err);
			else if (data) {
				const productIds = [];
				data.transactions.forEach((t) => t.products.forEach((p) => productIds.push(p.productID)));
				const products = await getProducts(productIds);
				data.products = products;
				data.clockins = (await getClockins(date, warehouseId)) || [];
				data.clockins = data.clockins.map((c) => {
					return {
						...c,
						employee: erply.ERPLY_EMPLOYEES.filter((e) => parseInt(e.employeeID) === parseInt(c.employeeID))[0],
					};
				});
				//data.employees = erply.ERPLY_EMPLOYEES;
				resolve(data);
			} else resolve({});
		});
	});
};

const getDayActivity = async (date) => {
	await init();
	return new Promise((resolve, reject) => {
		erply.getDayActivity(date, {}, function (err, data) {
			if (err) reject(err);
			else resolve(data);
		});
	});
};

const getClockins = async (date, warehouseId) => {
	return new Promise((resolve, reject) => {
		erply.getClockins(date, warehouseId, function (err, data) {
			if (err) reject(err);
			else resolve(data);
		});
	});
};
const getEmployees = async () => {
	return new Promise(async (resolve, reject) => {
		erply.getEmployees(function (err, data) {
			if (err) reject(err);
			else {
				resolve(data);
			}
		});
	});
};

const getStores = async (warehouseId = 1) => {
	return new Promise((resolve, reject) => {
		erply.getWarehouses(function (err, data) {
			if (err) reject(err);
			else resolve(data);
		});
	});
};
const getProducts = async (productIds) => {
	await init();
	return new Promise((resolve, reject) => {
		console.log('get products', productIds.length);
		erply.getProducts(productIds, function (err, data) {
			if (err) reject(err);
			else resolve(data);
		});
	});
};
module.exports = {
	getSales,
	getSalesDocuments,
	getPayments,
	getDayActivity,
	getClockins,
	getStores,
	getEmployees,
	getProducts,
};

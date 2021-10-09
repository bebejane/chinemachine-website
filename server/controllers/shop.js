const dotnev = require('dotenv').config();
const Errors = require('../common/errors');
const https = require('https');
const axios = require('axios');
const Product = require('../models/product');
const ObjectId = require('mongoose').Types.ObjectId;
const entities = require('entities');

const latest = async (page) => {
	if (page !== undefined && isNaN(page)) throw new Error('page is not a number');

	const products = await Product.find({})
		.sort({ created: 'asc' })
		.limit(10)
		.skip(page ? (page - 1) * 10 : 0)
		.lean();
	return products;
};
const get = async (id) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const product = await Product.findById(id).lean();
	return product;
};
const getAll = async (page, limit) => {
	if (isNaN(page)) throw new Error('page is not a number');
	const products = await etsyRequest('/shops/chinemachine/listings/active', {
		limit: page ? limit || 10 : undefined,
		offset: page ? (page - 1) * (limit || page) : 0,
		includes: 'MainImage',
	});
	return transformResult(products);
};
const getImages = async (id) => {
	if (!id) throw new Error('ID invalid');
	const images = await etsyRequest('/listings/' + id + '/images');
	return images;
};
const add = async (product) => {
	const newProduct = await Product.create(transformResult(product));
	return await get(newProduct._id);
};
const addMany = async (products) => {
	if (!products) throw new Error('no products to add');

	products = products.map((p) => transformResult(p));

	for (let i = 0; i < products.length; i++) await upsert(products[i]);

	return products;
};
const update = async (id, product) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const newProduct = await Product.findByIdAndUpdate(id, product, { new: true, runValidators: true }).lean();
	return await get(newProduct._id);
};
const upsert = async (product) => {
	return !product._id ? await add(product) : await update(product._id, { ...product });
};
const remove = async (productId) => {
	const product = await Product.findByIdAndDelete(productId).lean();
	return product;
};
const removeAll = async () => {
	const products = await Product.deleteMany({}).lean();
	return products;
};
const refreshEtsyProducts = async () => {
	let products = [];
	for (let page = 1; true; page++) {
		let prods = await getAll(page, 100);
		if (prods === undefined || prods.length <= 0) break;
		products = products.concat(prods);
	}
	await removeAll();
	await addMany(products);
	return products.length;
};
const etsyRequest2 = (path, params = {}) => {
	params = { ...params, api_key: process.env.ETSY_API_KEY };
	return new Promise((resolve, reject) => {
		const url =
			'https://openapi.etsy.com/v2' +
			path +
			'?' +
			Object.keys(params)
				.map((k) => k + '=' + params[k])
				.join('&');
		console.log('ETSY', url);
		https.get(url, (resp) => {
			let data = '';
			resp.on('data', (chunk) => (data += chunk));
			resp.on('end', () => {
				try {
					const resp = JSON.parse(data);
					resolve(resp);
				} catch (err) {
					reject('Empty response');
				}
			});
			resp.on('error', reject);
		});
	});
};
const etsyRequest = (path, params = {}) => {
	params = { ...params, api_key: process.env.ETSY_API_KEY };
	const url =
		'https://openapi.etsy.com/v2' +
		path +
		'?' +
		Object.keys(params)
			.map((k) => k + '=' + params[k])
			.join('&');
	//console.log(url)
	return axios.get(url).then((res) => {
		return res.data;
	});
};
const ETSY_MAP = {
	listing_id: 'productId',
	images: 'images',
	title: 'title',
	url: 'url',
	description: 'description',
	price: 'price',
	currency_code: 'currencyCode',
	creation_tsz: 'created',
	MainImage: 'image',
};
const transformResult = (obj) => {
	if (Array.isArray(obj.results)) {
		for (var i = 0; i < obj.results.length; i++) obj.results[i] = transformResult(obj.results[i]);
		return obj.results;
	}
	const newObj = {};
	Object.keys(ETSY_MAP).forEach((k) => {
		if (obj[k] !== undefined) newObj[ETSY_MAP[k]] = obj[k];
		else if (obj[ETSY_MAP[k]] !== undefined) newObj[ETSY_MAP[k]] = obj[ETSY_MAP[k]];
	});
	return newObj;
};

module.exports = {
	latest,
	get,
	getAll,
	add,
	addMany,
	getImages,
	update,
	upsert,
	remove,
	removeAll,
	refreshEtsyProducts,
};

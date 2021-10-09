const Errors = require('../common/errors');
const Store = require('../models/store');
const ObjectId = require('mongoose').Types.ObjectId;

const get = async (id) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const store = await Store.findById(id).lean();
	return store;
};
const getAll = async () => {
	const stores = await Store.find({}).lean();
	return stores;
};
const add = async (store) => {
	const newStore = await Store.create(store);
	return await get(newStore._id);
};
const update = async (id, store) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const newStore = await Store.findByIdAndUpdate(id, store, { new: true, runValidators: true }).lean();
	return await get(newStore._id);
};
const upsert = async (store) => {
	return !store._id ? await add(store) : await update(store._id, { ...store });
};
const remove = async (id) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const store = await Store.findByIdAndDelete(id).lean();
	return store;
};
const removeAll = async () => {
	const stores = await Store.deleteMany({}).lean();
	return stores;
};
module.exports = {
	get,
	getAll,
	add,
	update,
	upsert,
	remove,
	removeAll,
};

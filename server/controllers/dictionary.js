const config = require('dotenv').config({
	silent: process.env.NODE_ENV === 'production',
});
const Errors = require('../common/errors');
const Dictionary = require('../models/dictionary');
const ObjectId = require('mongoose').Types.ObjectId;
const fs = require('fs');
const get = async (id) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const dictionary = await Dictionary.findById(id).lean();
	return dictionary;
};
const getAll = async () => {
	const dictionaries = await Dictionary.find({}).lean();
	return dictionaries;
};
const getDictionary = async (langCode = process.env.DEFAULT_LANGUAGE) => {
	const dictionary = await Dictionary.find({}).lean();
	const dict = {};
	dictionary.forEach((item) => (dict[item.term] = item.language[langCode]));
	dict._langCode = langCode;
	return dict;
};

const add = async (dictionary) => {
	const newDictionary = await Dictionary.create(dictionary);
	return await get(newDictionary._id);
};
const update = async (id, dictionary) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const newDictionary = await Dictionary.findByIdAndUpdate(id, dictionary, {
		new: true,
		runValidators: true,
	}).lean();
	await exportAll(newDictionary);
	return await get(newDictionary._id);
};
const upsert = async (dictionary) => {
	return !dictionary._id ? await add(dictionary) : await update(dictionary._id, { ...dictionary });
};
const remove = async (dictionaryId) => {
	if (!ObjectId.isValid(dictionaryId)) throw new Error('invalid id ' + id);
	const dictionary = await Dictionary.findByIdAndDelete(dictionaryId).lean();
	return dictionary;
};
const removeAll = async () => {
	const dictionaries = await Dictionary.deleteMany({}).lean();
	return dictionaries;
};
const exportAll = async (dict) => {
	const dicts = await Dictionary.find({}).lean();
	dicts.push(dict);
	try {
		fs.writeFileSync('/Users/bebejane/Downloads/dictionary.json', JSON.stringify(dicts, null, 4));
	} catch (err) {
		console.error('Failed to write dictionary');
	}
};
const importAll = async () => {
	return;
	console.log('importing data');
	try {
		const data = fs.readFileSync('/Users/bebejane/Downloads/dictionary.json');
		const entries = JSON.parse(data);
		await Dictionary.deleteMany({});
		await Dictionary.insertMany(entries);
		console.log('done import');
	} catch (err) {
		return false;
	}
	return true;
};

module.exports = {
	get,
	getAll,
	getDictionary,
	add,
	update,
	upsert,
	remove,
	removeAll,
	importAll,
};

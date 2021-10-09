const Errors = require('../common/errors');
const Language = require('../models/language');

const get = async (langCode) => {
	if (!langCode) throw new Error('No language sepcified');
	const language = await Language.findOne({ langCode }).lean();
	return language;
};
const getAll = async () => {
	const languages = await Language.find({}).lean();
	return languages;
};
const add = async (language) => {
	const newLanguage = await Language.create(language);
	return await get(newLanguage._id);
};
const update = async (id, language) => {
	if (!id) throw new Error('No id sepcified');
	if (!language && typeof language !== 'object') throw new Error('Invalid input');

	const newLanguage = await Language.findByIdAndUpdate(id, language, { new: true, runValidators: true }).lean();
	return await get(newLanguage._id);
};
const upsert = async (language) => {
	return !language._id ? await add(language) : await update(language._id, { ...language });
};
const remove = async (languageId) => {
	const language = await Language.findByIdAndDelete(languageId).lean();
	return language;
};
const removeAll = async () => {
	const languages = await Language.deleteMany({}).lean();
	return languages;
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

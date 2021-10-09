const Errors = require('../common/errors');
const Info = require('../models/info');
const ObjectId = require('mongoose').Types.ObjectId;

const get = async (id) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const info = await Info.findById(id).lean();
	return info;
};
const getAll = async () => {
	const infos = await Info.find({}).lean();
	return infos;
};
const getBySection = async (sectionId, langCode) => {
	if (!ObjectId.isValid(sectionId)) throw new Error('invalid id ' + sectionId);
	const info = await Info.findOne({ sectionId, langCode }).lean();
	return info;
};
const add = async (info) => {
	const newInfo = await Info.create(info);
	return await get(newInfo._id);
};
const update = async (id, info) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const updatedInfo = await Info.findById(id);
	Object.keys(info).forEach((k) => (updatedInfo[k] = info[k]));
	await updatedInfo.save();
	return await get(updatedInfo._id);
};
const upsert = async (info) => {
	return !info._id ? await add(info) : await update(info._id, { ...info });
};
const remove = async (id) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const info = await Info.findByIdAndDelete(id).lean();
	return info;
};
const removeAll = async () => {
	const infos = await Info.deleteMany({}).lean();
	return infos;
};
const removeBySection = async (sectionId, langCode) => {
	const query = { sectionId };
	if (langCode !== undefined) query.langCode = langCode;
	const infos = await Info.deleteMany(query).lean();
	return infos;
};
module.exports = {
	get,
	getAll,
	getBySection,
	add,
	update,
	upsert,
	remove,
	removeAll,
	removeBySection,
};

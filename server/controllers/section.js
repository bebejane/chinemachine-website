const Errors = require('../common/errors');
const Section = require('../models/section');
const Info = require('../models/info');
const Gallery = require('../models/gallery');
const GalleryImage = require('../models/galleryImage');
const Image = require('../models/image');
const imageController = require('./image');
const infoController = require('./info');
const galleryController = require('./gallery');
const ObjectId = require('mongoose').Types.ObjectId;

const get = async (langCode) => {
	if (!langCode) return null;
	const section = await Section.findOne({ langCode }).lean();
	return section;
};
const getAll = async (langCode) => {
	const sections = await Section.find({}).sort('order').lean();
	const data = await Promise.all(
		sections.map((s) =>
			s.type === 'info' ? infoController.getBySection(s._id, langCode) : galleryController.getBySection(s._id, langCode)
		)
	);

	for (var i = 0; i < data.length; i++) sections[i].data = data[i] || {};
	return sections;
};
const getData = async (id, langCode) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);

	let section = await Section.findById(id).lean();
	let data = null;

	if (!section) throw new Error('No section found. ');

	const query = { sectionId: section._id };
	if (langCode) query.langCode = langCode;
	if (section.type === 'info') data = await Info.findOne(query).lean();
	else if (section.type === 'gallery') {
		data = await Gallery.findOne(query).lean();
		if (data) data.images = (await GalleryImage.find({ galleryId: data._id }).sort('order').lean()) || [];
	} else throw new Error('Type not ssupported. ' + section.type);

	return data;
};

const add = async (section) => {
	const newSection = await Section.create(section);
	return newSection;
};
const update = async (id, section) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	console.log('update section', section);
	if (!section) throw new Error('Can not find section to update');

	const newSection = await Section.findByIdAndUpdate(id, section, { new: true, runValidators: true }).lean();
	return get(newSection._id);
};
const updateMany = async (sections) => {
	for (var i = 0; i < sections.length; i++)
		sections[i] = await Section.findByIdAndUpdate(sections[i]._id, sections[i], {
			new: true,
			runValidators: true,
		}).lean();
	return sections;
};
const upsert = async (section) => {
	return !section._id ? await add(section) : await update(section._id, { ...section });
};
const remove = async (id) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const section = await Section.findById(id);
	if (!section) throw new Error('Can not find section to delete');

	if (section.type === 'info') await infoController.removeBySection(section._id);
	else if (section.type === 'gallery') await galleryController.removeBySection(section._id);

	const deletedSection = await Section.findByIdAndDelete(id);

	return deletedSection;
};
const removeAll = async () => {
	const sections = await Section.deleteMany({}).lean();
	return sections;
};
module.exports = {
	get,
	getAll,
	getData,
	add,
	update,
	updateMany,
	upsert,
	remove,
	removeAll,
};

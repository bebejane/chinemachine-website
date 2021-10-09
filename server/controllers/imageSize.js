const Errors = require('../common/errors');
const sharp = require('sharp');
const ImageSizeSize = require('../models/imageSize');
const ImageSize = require('../models/imageSize');

const get = async (id) => {
	if (!id) return null;
	const image = await ImageSize.findById(id, { image: 0 }).lean();
	return image;
};
const getAll = async () => {
	const images = await ImageSize.find({}, { image: 0 }).lean();
	return images;
};
const getImageSize = async (imageId, type) => {
	const image = await ImageSizeSize.find({ imageId, type }).lean();
	return image;
};
const add = async (img) => {
	const image = await ImageSize.create(img);
	return await get(image._id);
};
const update = async (id, image) => {
	const newImageSize = await ImageSize.findByIdAndUpdate(id, image, { new: true, runValidators: true })
		.select('-image')
		.lean();
	return await get(newImageSize._id);
};
const upsert = async (image) => {
	return !image._id ? await add(image) : await update(image._id, { ...image });
};
const remove = async (imageId) => {
	const image = await ImageSize.findByIdAndDelete(imageId).select('-image').lean();
	return image;
};
const removeAll = async () => {
	const images = await ImageSize.deleteMany({}).lean();
	return images;
};
module.exports = {
	get,
	getAll,
	getImageSize,
	add,
	update,
	upsert,
	remove,
	removeAll,
};

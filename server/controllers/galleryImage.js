const GalleryImage = require('../models/galleryImage');
const Errors = require('../common/errors');
const imageController = require('./image');

const get = async (id) => {
	const galleryImage = await GalleryImage.findById(id).lean();
	return galleryImage;
};
const getAll = async () => {
	const galleryImages = await GalleryImage.find({}).lean();
	return galleryImages;
};
const getByGallery = async (galleryId) => {
	const galleryImages = await GalleryImage.find({ galleryId }).sort('order').lean();
	return galleryImages;
};
const getBySection = async (sectionId) => {
	const galleryImages = await GalleryImage.find({ sectionId }).sort('order').lean();
	return galleryImages;
};
const add = async (galleryImage) => {
	console.log('create galleryimage', galleryImage);
	const newGalleryImage = await GalleryImage.create(galleryImage);
	return get(newGalleryImage._id);
};
const update = async (id, galleryImage) => {
	const newGalleryImage = await GalleryImage.findByIdAndUpdate(id, galleryImage, {
		new: true,
		runValidators: true,
	}).lean();
	return newGalleryImage;
};
const upsert = async (galleryImage) => {
	return !galleryImage._id ? await add(galleryImage) : await update(galleryImage._id, { ...galleryImage });
};
const remove = async (galleryImageId) => {
	const galleryImage = await GalleryImage.findByIdAndDelete(galleryImageId).lean();
	return galleryImage;
};
const removeAll = async () => {
	const galleryImages = await GalleryImage.deleteMany({}).lean();
	return galleryImages;
};
const removeGalleryImages = async (galleryId) => {
	const images = await getByGallery(galleryId);
	const galleryImages = await GalleryImage.deleteMany({ galleryId }).lean();
	const deleted = [];
	console.log('remove gallery images', images);
	for (var i = 0; i < images.length; i++) {
		deleted.push(await imageController.remove(images[i].imageId));
	}
	return galleryImages;
};
module.exports = {
	get,
	getAll,
	getByGallery,
	add,
	update,
	upsert,
	remove,
	removeAll,
	removeGalleryImages,
};

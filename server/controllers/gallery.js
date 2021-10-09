const Gallery = require('../models/gallery');
const Errors = require('../common/errors');
const galleryImageController = require('./galleryImage');
const ObjectId = require('mongoose').Types.ObjectId;

const get = async (id) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);

	const gallery = await Gallery.findById(id).lean();
	const images = await galleryImageController.getByGallery(gallery._id);
	return { ...gallery, images };
};
const getAll = async () => {
	const galleries = await Gallery.find({}).lean();
	for (var i = 0; i < galleries.length; i++) {
		galleries[i].images = await galleryImageController.getByGallery(galleries[i]._id);
	}
	return galleries;
};
const getBySection = async (sectionId, langCode) => {
	if (!ObjectId.isValid(sectionId)) throw new Error('invalid id ' + sectionId);
	const galleries = await Gallery.find({}).lean();
	const gallery = await Gallery.findOne({ sectionId, langCode }).lean();
	return gallery ? get(gallery._id) : null;
};
const getMain = async (langCode) => {
	if (!langCode) throw new Error('invalid langCode');
	const gallery = await Gallery.findOne({ langCode, mainGallery: true }).lean();
	if (!gallery) return null;

	return get(gallery._id);
};
const add = async (gallery) => {
	const newGallery = await Gallery.create(gallery);
	if (gallery.images && gallery.images.length) await addGalleryImages(gallery._id, gallery.images);

	return await get(newGallery._id);
};
const addGalleryImages = async (galleryId, images) => {
	if (!ObjectId.isValid(galleryId)) throw new Error('invalid id ' + galleryId);
	for (var i = 0; images && i < images.length; i++)
		images[i] = await galleryImageController.add({
			...images[i],
			imageId: images._id,
			galleryId,
		});

	return await get(galleryId);
};
const updateGalleryImages = async (galleryId, images) => {
	if (!ObjectId.isValid(galleryId)) throw new Error('invalid id ' + galleryId);
	for (var i = 0; images && i < images.length; i++)
		images[i] = await galleryImageController.update({
			...images[i],
			galleryId,
		});
	return await get(galleryId);
};
const update = async (id, gallery) => {
	if (!ObjectId.isValid(id)) throw new Error('invalid id ' + id);
	const newGallery = await Gallery.findById(id);
	const { sectionId } = newGallery;
	if (gallery.mainGallery !== newGallery.mainGallery) {
		await Gallery.updateMany({ mainGallery: true }, { mainGallery: false });
		await Gallery.updateMany({ sectionId }, { mainGallery: gallery.mainGallery });
	}

	Object.keys(gallery).forEach((k) => (newGallery[k] = gallery[k]));
	await newGallery.save();
	if (gallery.images) await updateGalleryImages(gallery._id, gallery.images);
	return await get(newGallery._id);
};
const upsert = async (gallery) => {
	return !gallery._id ? await add(gallery) : await update(gallery._id, { ...gallery });
};
const remove = async (galleryId) => {
	if (!ObjectId.isValid(galleryId)) throw new Error('invalid id ' + galleryId);
	const gallery = await Gallery.findByIdAndDelete(galleryId).lean();
	const deltetedImages = await galleryImageController.deleteGalleryImages(galleryId);
	return gallery;
};
const removeAll = async () => {
	const galleries = await Gallery.deleteMany({}).lean();
	const deltetedImages = await galleryImageController.removeAll();
	return galleries;
};
const removeBySection = async (sectionId) => {
	if (!ObjectId.isValid(sectionId)) throw new Error('invalid id ' + sectionId);
	const galleries = await Gallery.find({ sectionId }).lean();
	console.log('remove section gallery', sectionId, galleries);
	if (galleries && galleries.length) {
		for (var i = 0; i < galleries.length; i++) {
			await galleryImageController.removeGalleryImages(galleries[i]._id);
			await Gallery.findByIdAndDelete(galleries[i]._id);
		}
	}
	return galleries;
};

module.exports = {
	get,
	getAll,
	getBySection,
	getMain,
	add,
	update,
	upsert,
	remove,
	removeAll,
	removeBySection,
};

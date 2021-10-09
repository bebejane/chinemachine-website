const Errors = require('../common/errors');
const sharp = require('sharp');
const ImageSize = require('../models/imageSize');
const ImageSize2 = require('../models/imageSize2');
const Image = require('../models/image');
const GalleryImage = require('../models/galleryImage');
const ObjectId = require('mongoose').Types.ObjectId;

const resizeImage = async (image) => {
	const { width, height, format } = await sharp(image.image.data).metadata();
	const { data } = image.image;

	console.log('resize image', width + 'x' + height, format, image.mimeType);
	const sizes = [
		{
			imageId: image._id,
			type: 'high',
			image: {
				data: await sharp(data)
					.resize(2000, 1500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1.0 } })
					.toBuffer(),
				contentType: image.mimeType,
			},
			mimeType: image.mimeType,
		},
		{
			imageId: image._id,
			type: 'medium',
			image: {
				data: await sharp(data)
					.resize(800, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1.0 } })
					.toBuffer(),
				contentType: image.mimeType,
			},
			mimeType: image.mimeType,
		},
		{
			imageId: image._id,
			type: 'low',
			image: {
				data: await sharp(data)
					.resize(400, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1.0 } })
					.toBuffer(),
				contentType: image.mimeType,
			},
			mimeType: image.mimeType,
		},
		{
			imageId: image._id,
			type: 'thumb',
			image: {
				data: await sharp(data)
					.resize(50, 50, { fit: 'fill', background: { r: 0, g: 0, b: 0, alpha: 1.0 } })
					.toBuffer(),
				contentType: image.mimeType,
			},
			mimeType: image.mimeType,
		},
	];
	return Promise.resolve(sizes);
};

const get = async (id) => {
	if (!id) return null;
	const image = await Image.findById(id, { image: 0 }).lean();
	return image;
};
const getAll = async () => {
	const images = await Image.find({}, { image: 0 }).lean();
	return images;
};
const getImage = async (imageId, type) => {
	if (!ObjectId.isValid(imageId)) throw new Error('imageId invalid');

	let image;
	if (type !== undefined) image = await ImageSize.findOne({ imageId, type });
	else image = await Image.findById(imageId);

	return image;
};

const add = async (img) => {
	console.log('ADD IMAGE');
	const image = await Image.create(img);
	const images = await resizeImage(image);
	for (var i = 0; i < images.length; i++) images[i] = await ImageSize.create(images[i]);

	return await get(image._id);
};
const update = async (id, image) => {
	const newImage = await Image.findByIdAndUpdate(id, image, { new: true, runValidators: true }).select('-image').lean();
	return await get(newImage._id);
};
const upsert = async (image) => {
	return !image._id ? await add(image) : await update(image._id, { ...image });
};
const remove = async (imageId) => {
	console.log('remove image', imageId);
	const image = await Image.findByIdAndDelete(imageId).select('-image').lean();
	const deleted = await ImageSize.deleteMany({ imageId });
	return image;
};
const removeAll = async () => {
	const images = await Image.deleteMany({}).lean();
	return images;
};

const resizeAll = async () => {
	return;
	console.log('Resizing images...');
	//await ImageSize2.deleteMany({})

	const images = await Image.find({});

	console.log('resizing', images.length);

	for (var i = 0; i < images.length; i++) {
		const image = images[i];
		try {
			const { width, height, format } = await sharp(image.image.data).metadata();

			const sizes = [
				{
					imageId: image._id,
					type: 'high',
					image: {
						data: await sharp(image.image.data)
							.resize(2000, 1500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1.0 } })
							.toBuffer(),
						contentType: image.mimeType,
					},
					mimeType: image.mimeType,
				},
				{
					imageId: image._id,
					type: 'medium',
					image: {
						data: await sharp(image.image.data)
							.resize(800, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1.0 } })
							.toBuffer(),
						contentType: image.mimeType,
					},
					mimeType: image.mimeType,
				},
				{
					imageId: image._id,
					type: 'low',
					image: {
						data: await sharp(image.image.data)
							.resize(400, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1.0 } })
							.toBuffer(),
						contentType: image.mimeType,
					},
					mimeType: image.mimeType,
				},
				{
					imageId: image._id,
					type: 'thumb',
					image: {
						data: await sharp(image.image.data)
							.resize(50, 50, { fit: 'fill', background: { r: 0, g: 0, b: 0, alpha: 1.0 } })
							.toBuffer(),
						contentType: image.mimeType,
					},
					mimeType: image.mimeType,
				},
			];

			for (var x = 0; x < sizes.length; x++) {
				//await ImageSize2.create(sizes[x])
				await ImageSize.findOneAndUpdate({ imageId: image._id, type: sizes[x].type }, sizes[x]);
				console.log('.');
			}
			console.log(image._id, width, height);
		} catch (err) {
			console.log(err);
			console.log(image._id);
			//5ffd7da3c7c2578097001fa0
		}
	}

	console.log('resized images', images.length);
};
module.exports = {
	get,
	getAll,
	getImage,
	add,
	update,
	upsert,
	remove,
	removeAll,
	resizeAll,
};

const mongoose = require('mongoose');
const Image = require('./image');
const ImageSize = require('./imageSize');
const Gallery = require('./gallery');
const Section = require('./section');
const Schema = mongoose.Schema;

const GalleryImageSchema = new Schema(
	{
		galleryId: {
			type: Schema.Types.ObjectId,
			ref: 'Gallery',
			required: true,
			validate: {
				validator: (_id) =>
					new Promise((resolve, reject) => {
						Gallery.exists({ _id }, (err, exists) => {
							!exists || err ? reject(err || 'galleryId "' + _id + '" does not exist') : resolve();
						});
					}),
			},
		},
		sectionId: {
			type: Schema.Types.ObjectId,
			ref: 'Section',
			required: true,
			validate: {
				validator: (_id) =>
					new Promise((resolve, reject) => {
						Section.exists({ _id }, (err, exists) => {
							!exists || err ? reject(err || 'sectionId "' + _id + '" does not exist') : resolve();
						});
					}),
			},
		},
		imageId: {
			type: Schema.Types.ObjectId,
			ref: 'Image',
			required: true,
		},
		order: {
			type: Number,
			required: true,
		},
		labels: {
			type: Object,
			default: {},
			required: false,
		},
	},
	{ minimize: false }
);

GalleryImageSchema.pre('remove', function (next) {
	Promise.all([ImageSize.deleteMany({ imageId: this.imageId }), Image.findOneAndDelete({ _id: this.imageId })])
		.then(() => next())
		.catch(next);
});
GalleryImageSchema.virtual('image', {
	ref: 'Image',
	localField: 'imageId',
	foreignField: '_id',
	justOne: true,
});
GalleryImageSchema.set('toObject', { virtuals: true });
GalleryImageSchema.set('toJSON', { virtuals: true });
const GalleryImage = mongoose.models.GalleryImage || mongoose.model('GalleryImage', GalleryImageSchema);
module.exports = GalleryImage;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSizeSchema = new Schema({
	imageId: {
		type: Schema.Types.ObjectId,
		ref: 'Image',
	},
	image: {
		data: Buffer,
		contentType: String,
	},
	mimeType: {
		type: String,
		required: true,
	},
	type: {
		type: String,
		required: true,
	},
});
module.exports = mongoose.models.ImageSize || mongoose.model('ImageSize', ImageSizeSchema);

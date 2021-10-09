const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSize2Schema = new Schema({
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
module.exports = mongoose.models.ImageSize2 || mongoose.model('ImageSize2', ImageSize2Schema);

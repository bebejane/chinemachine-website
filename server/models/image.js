const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
	image: {
		data: Buffer,
		contentType: String,
	},
	mimeType: {
		type: String,
		required: true,
	},
	width: {
		type: Number,
		required: false,
	},
	height: {
		type: Number,
		required: false,
	},
});

module.exports = mongoose.models.Image || mongoose.model('Image', ImageSchema);

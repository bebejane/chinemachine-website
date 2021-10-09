const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;
const SECTION_TYPES = ['info', 'gallery', 'mainGallery'];

const SectionSchema = new Schema({
	name: {
		type: String,
		required: [true, 'Name empty'],
	},
	type: {
		type: String,
		required: [true, 'No type specified'],
		validate: {
			validator: (type) => SECTION_TYPES.includes(type),
			message: (props) => props.value + ' is not a valid type!',
		},
	},
	order: {
		type: Number,
		required: false,
	},
});

SectionSchema.plugin(AutoIncrement, { inc_field: 'order' });
module.exports = mongoose.models.Section || mongoose.model('Section', SectionSchema);

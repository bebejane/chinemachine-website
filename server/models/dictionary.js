const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DictionarySchema = new Schema(
	{
		term: {
			type: String,
			unique: true,
			required: true,
		},
		language: {
			type: Object,
			default: {},
			required: false,
		},
	},
	{ minimize: false, strict: true }
);

DictionarySchema.post('save', (error, doc, next) => {
	if (error.name === 'MongoError' && error.code === 11000) {
		next(new Error('Term must be unique!'));
	} else {
		next(error);
	}
});
module.exports = mongoose.models.Dictionary || mongoose.model('Dictionary', DictionarySchema);

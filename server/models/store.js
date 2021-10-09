const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StoreSchema = new Schema({
	name: {
		type: String,
		required: true,
	},
	address: {
		type: String,
		required: true,
	},
	postalCode: {
		type: Number,
		required: true,
	},
	city: {
		type: String,
		default: 'Paris',
		required: true,
	},
	phone: {
		type: String,
		required: true,
	},
	openingHours: {
		type: Array,
		required: true,
	},
	sellingHours: {
		type: Array,
		required: true,
	},
	holidays: {
		type: Array,
		default: [],
		required: false,
	},
	status: {
		type: String,
		required: false,
	},
});
module.exports = mongoose.models.Store || mongoose.model('Store', StoreSchema);

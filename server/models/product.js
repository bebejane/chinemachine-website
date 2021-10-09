const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
	productId: {
		type: String,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: false,
	},
	image: {
		type: Object,
		required: false,
	},
	url: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	currencyCode: {
		type: String,
		required: true,
	},
	show: {
		type: Boolean,
		required: true,
		default: true,
	},
	created: {
		type: Number,
		required: false,
	},
});
module.exports = mongoose.models.Product || mongoose.model('Product', ProductSchema);

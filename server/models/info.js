const mongoose = require('mongoose');
const Section = require('./section');
const Schema = mongoose.Schema;

const InfoSchema = new Schema({
	sectionId: {
		type: Schema.Types.ObjectId,
		ref: 'Section',
		required: true,
		validate: {
			validator: (_id) =>
				new Promise((resolve, reject) => {
					Section.exists({ _id }, (err, exists) => {
						if (!exists || err) reject(err || 'sectionId ' + _id + 'doesnt exist');
						else resolve();
					});
				}),
		},
	},
	langCode: {
		type: String,
		required: [true, 'Language code required'],
	},
	header: {
		type: String,
		required: [true, 'Header required'],
	},
	active: {
		type: Boolean,
		default: false,
	},
	html: {
		type: String,
	},
	content: {
		type: Object,
	},
});
InfoSchema.pre('save', async function (next) {
	const { sectionId } = this;
	const activeInfo = await Info.updateMany({ sectionId: this.sectionId }, { active: this.active });
	next();
});
InfoSchema.post('save', async function (doc) {
	const { active } = doc;
	await Info.updateMany({ sectionId: doc.sectionId }, { active });
});
const Info = mongoose.models.Info || mongoose.model('Info', InfoSchema);

module.exports = Info;

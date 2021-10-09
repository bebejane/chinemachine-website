const mongoose = require('mongoose');
const Section = require('./section');
const Schema = mongoose.Schema;

const GallerySchema = new Schema({
	sectionId: {
		type: Schema.Types.ObjectId,
		ref: 'Section',
		required: true,
		validate: {
			validator: (_id) =>
				new Promise((resolve, reject) => {
					Section.exists({ _id }, (err, exists) => {
						if (!exists || err) reject(err || 'sectionId ' + _id + ' doesnt exist');
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
	mainGallery: {
		type: Boolean,
		default: false,
	},
	active: {
		type: Boolean,
		default: false,
	},
});

/*
GallerySchema.pre('save', async function(next){
	
	const {sectionId, mainGallery} = this;
	console.log('PRE SAVE', sectionId, mainGallery)
	const gallery = await Gallery.findById(sectionId)

	await Gallery.updateMany({sectionId:this.sectionId}, {mainGallery})
	next()
});
GallerySchema.post('save', async function(doc){
	console.log('POST SAVE')
	const {mainGallery, images, sectionId} = doc;
	console.log('POST SAVE', mainGallery)
	await Gallery.updateMany({mainGallery:true}, {mainGallery:false})
	await Gallery.updateMany({sectionId}, {mainGallery})
});
*/
GallerySchema.virtual('images', {
	ref: 'GalleryImage',
	localField: '_id',
	foreignField: 'galleryId',
	justOne: false,
});

GallerySchema.set('toObject', { virtuals: true });
GallerySchema.set('toJSON', { virtuals: true });

const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', GallerySchema);

module.exports = Gallery;

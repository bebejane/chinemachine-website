import { axios } from './';

export default {
	get: async (id) => {
		let res = await axios.get('/api/galleryImage/' + id);
		return res.data;
	},
	getAll: async () => {
		let res = await axios.get('/api/galleryImage');
		return res.data || [];
	},
	getImages: async (sectionId) => {
		let res = await axios.get('/api/galleryImages/' + sectionId);
		const images = res.data || [];
		images.forEach((image) => {
			image.src = '/api/galleryImage/' + image._id + '/image';
		});
		return images;
	},
	add: async (params) => {
		let res = await axios.post('/api/galleryImage', params);
		return res.data;
	},
	update: async (id, galleryImage) => {
		let res = await axios.patch('/api/galleryImage/' + id, galleryImage);
		return res.data;
	},
	delete: async (galleryId) => {
		let res = await axios.delete('/api/galleryImage/' + galleryId);
		return res.data;
	},
	deleteAll: async () => {
		let res = await axios.delete('/api/galleryImage');
		return res.data;
	},
};

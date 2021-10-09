import { axios } from './';

export default {
	get: async (id) => {
		let res = await axios.get('/api/gallery/' + id);
		return res.data;
	},
	getAll: async () => {
		let res = await axios.get('/api/gallery');
		return res.data || [];
	},
	getData: async (sectionId, langCode) => {
		console.log('/api/gallery/' + sectionId + '/' + langCode);
		let res = await axios.get('/api/gallery/' + sectionId + '/' + langCode);
		return res.data || {};
	},
	getMain: async (langCode) => {
		let res = await axios.get('/api/gallery/main/' + langCode + '/gallery');
		return res.data || {};
	},
	add: async (params) => {
		let res = await axios.post('/api/gallery', params);
		return res.data;
	},
	update: async (id, gallery) => {
		let res = await axios.patch('/api/gallery/' + id, gallery);
		return res.data;
	},
	delete: async (id) => {
		let res = await axios.delete('/api/gallery/' + id);
		return res.data;
	},
	deleteAll: async () => {
		let res = await axios.delete('/api/gallery');
		return res.data;
	},
};

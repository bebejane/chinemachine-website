import { axios } from './';

export default {
	get: async (id) => {
		let res = await axios.get('/api/section/' + id);
		return res.data;
	},
	getAll: async () => {
		let res = await axios.get('/api/section');
		return res.data || [];
	},
	getAllSectionData: async (langCode) => {
		let res = await axios.get('/api/section/all/' + langCode);
		return res.data || [];
	},
	getSectionData: async (sectionId, langCode) => {
		const path = '/api/section/' + sectionId + (langCode ? '/' + langCode : '');
		let res = await axios.get(path);
		return res.data;
	},
	add: async (params) => {
		let res = await axios.post('/api/section', params);
		return res.data;
	},
	update: async (id, section) => {
		let res = await axios.patch('/api/section/' + id, section);
		return res.data;
	},
	updateMany: async (sections) => {
		let res = await axios.patch('/api/section', sections);
		return res.data;
	},
	delete: async (id) => {
		let res = await axios.delete('/api/section/' + id);
		return res.data;
	},
	deleteAll: async () => {
		let res = await axios.delete('/api/section');
		return res.data;
	},
};

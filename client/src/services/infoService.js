import { axios } from './';

export default {
	get: async (id) => {
		let res = await axios.get('/api/info/' + id);
		return res.data;
	},
	getAll: async () => {
		let res = await axios.get('/api/info');
		return res.data || [];
	},
	getData: async (sectionId, langCode) => {
		let res = await axios.get('/api/info/' + sectionId + '/' + langCode);
		return res.data || {};
	},
	add: async (params) => {
		let res = await axios.post('/api/info', params);
		return res.data;
	},
	update: async (id, info) => {
		let res = await axios.patch('/api/info/' + id, info);
		return res.data;
	},
	delete: async (sectionId) => {
		let res = await axios.delete('/api/info/' + sectionId);
		return res.data;
	},
	deleteAll: async () => {
		let res = await axios.delete('/api/info');
		return res.data;
	},
};

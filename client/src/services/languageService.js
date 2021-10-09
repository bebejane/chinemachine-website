import { axios } from './';

export default {
	get: async (langCode) => {
		let res = await axios.get('/api/language/' + langCode);
		return res.data;
	},
	getAll: async () => {
		let res = await axios.get('/api/language');
		return res.data || [];
	},
	add: async (params) => {
		let res = await axios.post('/api/language', params);
		return res.data;
	},
	update: async (langCode, language) => {
		let res = await axios.patch('/api/language/' + langCode, language);
		return res.data;
	},
	delete: async (langCode) => {
		let res = await axios.delete('/api/language/' + langCode);
		return res.data;
	},
	deleteAll: async () => {
		let res = await axios.delete('/api/language');
		return res.data;
	},
	set: async (langCode) => {
		let res = await axios.get('/api/language/set/' + langCode);
		return res.data;
	},
};

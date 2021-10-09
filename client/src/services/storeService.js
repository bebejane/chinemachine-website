import { axios } from './';

export default {
	get: async (storeId) => {
		let res = await axios.get('/api/store/' + storeId);
		return res.data;
	},
	getAll: async () => {
		let res = await axios.get('/api/store');
		return res.data || [];
	},
	add: async (params) => {
		let res = await axios.post('/api/store', params);
		return res.data;
	},
	update: async (id, params) => {
		let res = await axios.patch('/api/store/' + id, params);
		return res.data;
	},
	delete: async (storeId) => {
		let res = await axios.delete('/api/store/' + storeId);
		return res.data;
	},
	deleteAll: async () => {
		let res = await axios.delete('/api/store');
		return res.data;
	},
};

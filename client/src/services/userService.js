import { axios } from './';

export default {
	get: async (userId) => {
		let res = await axios.get('/api/user/' + userId);
		return res.data;
	},
	getAll: async () => {
		let res = await axios.get('/api/user');
		return res.data || [];
	},
	getAppointments: async () => {
		let res = await axios.get('/api/user/appointmens/all');
		return res.data || [];
	},
	add: async (params) => {
		let res = await axios.post('/api/user', params);
		return res.data;
	},
	update: async (id, params) => {
		let res = await axios.patch('/api/user/' + id, params);
		return res.data;
	},
	delete: async (id) => {
		let res = await axios.delete('/api/user/' + id);
		return res.data;
	},
	deleteAll: async () => {
		let res = await axios.delete('/api/user');
		return res.data;
	},
	search: async (term) => {
		let res = await axios.get('/api/user/util/search/' + term);
		return res.data || [];
	},
};

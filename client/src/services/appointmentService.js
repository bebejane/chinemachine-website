import { axios } from './';

export default {
	get: async (id) => {
		let res = await axios.get('/api/appointment/' + id);
		return res.data;
	},
	getAll: async () => {
		let res = await axios.get('/api/appointment');
		return res.data || [];
	},
	getByDate: async (year, month, date, storeId) => {
		const path =
			'/api/appointment/' +
			year +
			(month !== undefined ? '/' + month : '') +
			(month !== undefined && date ? '/' + date : '') +
			(storeId ? '/store/' + storeId : '');
		let res = await axios.get(path);
		return res.data || [];
	},
	getByMonth: async (year, month, storeId) => {
		let res = await axios.get('/api/appointment/' + year + '/' + month + (storeId ? '/store/' + storeId : ''));
		return res.data || [];
	},
	getAllByMonth: async (year, month) => {
		let res = await axios.get('/api/appointment/' + year + '/' + month);
		return res.data || [];
	},
	getAllByWeek: async (year, week) => {
		let res = await axios.get('/api/appointment/util/byweek/' + year + '/' + week);
		return res.data || [];
	},
	getAllByUser: async (userId) => {
		let res = await axios.get('/api/appointment/user/' + userId);
		return res.data || [];
	},
	getData: async (sectionId, langCode) => {
		let res = await axios.get('/api/appointment/' + sectionId + '/' + langCode);
		return res.data || {};
	},
	add: async (params) => {
		let res = await axios.post('/api/appointment', params);
		return res.data;
	},
	update: async (id, appointment) => {
		let res = await axios.patch('/api/appointment/' + id, appointment);
		return res.data;
	},
	delete: async (sectionId) => {
		let res = await axios.delete('/api/appointment/' + sectionId);
		return res.data;
	},
	deleteAll: async () => {
		let res = await axios.delete('/api/appointment');
		return res.data;
	},
	cancel: async (userId, appointmentId) => {
		let res = await axios.post('/api/appointment/user/' + userId + '/appointment/' + appointmentId + '/cancel');
		return res.data;
	},
	book: async (userId, appointmentId) => {
		let res = await axios.post('/api/appointment/user/' + userId + '/appointment/' + appointmentId + '/book');
		return res.data;
	},
	bookInternal: async (userId, appointmentId) => {
		let res = await axios.post('/api/appointment/user/' + userId + '/appointment/' + appointmentId + '/bookinternal');
		return res.data;
	},
};

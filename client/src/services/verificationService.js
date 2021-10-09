import { axios } from './';

export default {
	getUser: async () => {
		let res = await axios.get('/status');
		return res.data;
	},
	login: async (email, password) => {
		let res = await axios.post('/verification/login', { email, password });
		return res.data;
	},
	logout: async (email) => {
		let res = await axios.post('/verification/logout', { email });
		return res.data;
	},
	signup: async (params) => {
		let res = await axios.post('/verification/signup', params);
		return res.data;
	},
	verify: async (tokenOrCode) => {
		let res = await axios.get('/verification/verify/' + tokenOrCode);
		return res.data;
	},
	reverify: async (email) => {
		let res = await axios.get('/verification/reverify/' + email);
		return res.data;
	},
	requestPasswordReset: async (email) => {
		let res = await axios.get('/verification/reset/' + email);
		return res.data;
	},
	updatePassword: async (token, password, password2) => {
		let res = await axios.post('/verification/update', { token, password, password2 });
		return res.data;
	},
};

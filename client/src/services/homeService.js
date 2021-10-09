import { axios } from './';

export default {
	get: async (langCode) => {
		let res = await axios.get('/api/home');
		return res.data;
	},
};

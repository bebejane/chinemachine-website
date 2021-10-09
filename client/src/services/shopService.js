import { axios } from './';

export default {
	get: async (id) => {
		let res = await axios.get('/api/shop/product/' + id);
		return res.data.results ? res.data.results[0] : null;
	},
	getAll: async () => {
		let res = await axios.get('/api/shop/product');
		return res.data.results || [];
	},
	getImages: async (id) => {
		let res = await axios.get('/api/shop/product/' + id + '/images');
		return res.data.results || [];
	},
	page: async (page) => {
		let res = await axios.get('/api/shop/product/page/' + page);
		return res.data.results || [];
	},
	addMany: async (products) => {
		let res = await axios.post('/api/shop/product', products);
		return res.data.results || [];
	},
	removeMany: async (products) => {
		let res = await axios.delete('/api/shop/product', products);
		return res.data.results || [];
	},
	latest: async (page) => {
		const path = '/api/shop/latest' + (page ? '/page/' + page : '');
		let res = await axios.get(path);
		return res.data || [];
	},
};

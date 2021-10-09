import { axios } from './';
import moment from 'moment';

export default {
	today: async (warehouseId) => {
		let res = await axios.get('/api/erply/today' + warehouseId !== undefined ? '/' + warehouseId : '');
		return res.data ? res.data : [];
	},
	getSales: async (date, warehouseId = 1) => {
		let path =
			'/api/erply/sales/' +
			warehouseId +
			'/' +
			date.getFullYear() +
			'/' +
			date.getMonth() +
			'/' +
			date.getDate() +
			(moment(date).isSame(moment(), 'day') ? '/refresh' : '');
		let res = await axios.get(path);
		return res.data ? res.data : [];
	},
	getSalesReport: async (date, warehouseId = 1) => {
		let res = await axios.get(
			'/api/erply/sales/report/' +
				warehouseId +
				'/' +
				date.getFullYear() +
				'/' +
				date.getMonth() +
				'/' +
				date.getDate() +
				(moment(date).isSame(moment(), 'day') ? '/refresh' : '')
		);
		return res.data ? res.data : [];
	},
	getStores: async () => {
		let res = await axios.get('/api/erply/stores');
		return res.data ? res.data : [];
	},
};

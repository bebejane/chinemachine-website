import { axios } from './';

export default {
	get: async (id) => {
		let res = await axios.get('/api/image/' + id);
		return res.data;
	},
	getAll: async () => {
		let res = await axios.get('/api/image');
		return res.data || [];
	},
	add: async (params) => {
		const formData = new FormData();
		formData.append('image', params.image);
		formData.append('mimeType', params.mimeType);

		let res = await axios({
			url: '/api/image',
			method: 'POST',
			data: formData,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'multipart/form-data',
			},
		});
		return res.data;
	},
	update: async (params) => {
		const formData = new FormData();
		formData.append('_id', params._id);
		formData.append('image', params.image);
		formData.append('mimeType', params.mimeType);

		let res = await axios({
			url: '/api/image',
			method: 'PATCH',
			data: formData,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'multipart/form-data',
			},
		});
		return res.data;
	},
	delete: async (imageId) => {
		let res = await axios.delete('/api/image/' + imageId);
		return res.data;
	},
	deleteAll: async () => {
		let res = await axios.delete('/api/image');
		return res.data;
	},
};

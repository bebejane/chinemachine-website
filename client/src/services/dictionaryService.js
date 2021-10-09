import { axios } from './';

export default {
	get: async (id) => {
		let res = await axios.get('/api/dictionary/id/' + id);
		return res.data || {};
	},
	getAll: async () => {
		let res = await axios.get('/api/dictionary/all');
		return res.data || [];
	},
	getDictionary: async (langCode) => {
		let res = await axios.get('/api/dictionary');
		return res.data;
	},
	add: async (term) => {
		let res = await axios.post('/api/dictionary/', { term });
		return res.data;
	},
	update: async (dict) => {
		let res = await axios.patch('/api/dictionary/' + dict._id, dict);
		return res.data;
	},
	updateMany: async (dictionary) => {
		const items = await axios.patch('/api/dictionary', dictionary);
		return items;
		/*
        const data = []
        for (var i = 0; i < dictionary.length; i++){
            const item = await axios.patch('/api/dictionary/' +dictionary[i]._id, dictionary[i])
            data.push(item.data)
        }
        return data || []
        */
	},
	delete: async (id) => {
		let res = await axios.delete('/api/dictionary/' + id);
		return res.data;
	},
	deleteAll: async () => {
		let res = await axios.delete('/api/dictionary');
		return res.data;
	},
};

require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const fs = require('fs');
const storeController = require('../../controllers/store');
const dictionaryController = require('../../controllers/dictionary');
const { htmlToText } = require('html-to-text');

const generate = async (name, params = {}, langCode) => {
	const html = await generateHtml(name, params, langCode);
	const footer = await generateFooter(langCode);
	return {
		html: html + footer,
		text: htmlToText(html + footer),
	};
};
const generateHtml = async (template, params = {}, langCode = process.env.DEFAULT_LANGUAGE) => {
	const templatePath = __dirname + '/templates/' + template + '.html';
	const dict = await dictionaryController.getDictionary(langCode);
	params = { ...dict, ...params, hostAddress: process.env.APP_ENDPOINT };

	let html;

	try {
		html = fs.readFileSync(templatePath, { encoding: 'utf8' });
		Object.keys(params).forEach((k) => (html = html.replace(new RegExp('{{' + k + '}}', 'gi'), params[k])));
		return html;
	} catch (err) {
		throw new Error('Cant find template: ' + templatePath);
	}
};
const generateFooter = async (langCode) => {
	const stores = await storeController.getAll();
	let html = '';
	for (var i = 0; i < stores.length; i++) {
		html += stores[i].address + '<br/>' + stores[i].postalCode + ' ' + stores[i].city + '<br/>';
		html += 'Tel: <a href="tel:' + stores[i].phone + '">' + stores[i].phone + '</a>';
		html += '</p>';
	}
	const footer = await generateHtml('footer', { stores: html, phoneNumber: stores[0].phone }, langCode);
	return footer;
};
const translateSubject = async () => {};
module.exports = {
	generate,
	generateHtml,
};

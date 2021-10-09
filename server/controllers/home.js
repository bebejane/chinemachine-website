const config = require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const Errors = require('../common/errors');
const Section = require('../models/section');
const infoController = require('../controllers/info');
const languageController = require('../controllers/language');
const dictionaryController = require('../controllers/dictionary');
const galleryController = require('../controllers/gallery');
const sectionController = require('../controllers/section');

const get = async (langCode = process.env.DEFAULT_LANGUAGE) => {
	const result = await Promise.all([
		sectionController.getAll(langCode),
		languageController.getAll(),
		dictionaryController.getDictionary(langCode),
		galleryController.getMain(langCode),
	]);
	const sections = result[0].filter((s) => s.data.header);
	const languages = result[1];
	const dictionary = result[2];
	const mainGallery = result[3];
	return { langCode, sections, languages, dictionary, mainGallery };
};
module.exports = {
	get,
};

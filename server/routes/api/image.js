require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: './' });
const imageController = require('../../controllers/image');

// Serve images
router.get('/:id/image', async (req, res, next) => {
	try {
		const image = await imageController.getImage(req.params.id);
		res.set('Content-Type', 'image/*');
		res.contentType(image.mimeType);
		res.send(image.image.data);
	} catch (err) {
		next(err);
	}
});
router.get('/:id/image/:type', async (req, res, next) => {
	try {
		const image = await imageController.getImage(req.params.id, req.params.type);
		//res.set('Content-Type', 'image/*');
		res.contentType(image.mimeType);
		res.send(image.image.data);
	} catch (err) {
		next(err);
	}
});

// the rest
router.get('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const images = await imageController.getAll();
		return res.json(images);
	} catch (err) {
		next(err);
	}
});

router.get('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const image = await imageController.get(req.params.id);
		return res.json(image);
	} catch (err) {
		next(err);
	}
});

router.post('/', authorize(Roles.ADMINISTRATOR), upload.single('image'), async (req, res, next) => {
	try {
		const { path, mimetype } = req.file;
		const data = fs.readFileSync(path);
		const image = await imageController.add({ image: { data, contentType: mimetype }, mimeType: mimetype });
		fs.unlinkSync(path);
		res.json(image);
	} catch (err) {
		next(err);
	}
});
router.patch('/', authorize(Roles.ADMINISTRATOR), upload.single('image'), async (req, res, next) => {
	try {
		const image = {};
		const data = fs.readFileSync(req.file.path);
		if (req.file) {
			image.image = { data, contentType: req.file.mimetype };
			image.mimeType = req.file.mimetype;
		}

		const updatedImage = await imageController.update(image._id, { ...req.body, ...image });
		if (req.file && req.file.path) fs.unlinkSync(req.file.path);

		res.json(updatedImage);
	} catch (err) {
		next(err);
	}
});
router.delete('/', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const deletedImages = await imageController.removeAll();
		res.json(deletedImages);
	} catch (err) {
		next(err);
	}
});
router.delete('/:id', authorize(Roles.ADMINISTRATOR), async (req, res, next) => {
	try {
		const deletedImage = await imageController.remove(req.params.id);
		res.json(deletedImage);
	} catch (err) {
		next(err);
	}
});

module.exports = router;

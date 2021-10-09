require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../database/roles');
const authorize = require('../middleware/authorize');
const Section = require('../models/section');
const Info = require('../models/info');
const Gallery = require('../models/gallery');
const GalleryImage = require('../models/galleryImage');
/*
router.delete('/all', async (req, res, next) => {
    await Info.deleteMany({})
    await Gallery.deleteMany({})
    await GalleryImage.deleteMany({})

    res.json({ killed: 'YES!..' })
});
*/
module.exports = router;

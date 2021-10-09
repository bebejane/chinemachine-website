require('dotenv').config({ silent: process.env.NODE_ENV === 'production' });
const express = require('express');
const router = express.Router();
const { Roles } = require('../../database/roles');
const authorize = require('../../middleware/authorize');

router.use('/image', require('./image'));
router.use('/imageSize', require('./imageSize'));
router.use('/appointment', require('./appointment'));
router.use('/dictionary', require('./dictionary'));
router.use('/gallery', require('./gallery'));
router.use('/galleryImage', require('./galleryImage'));
router.use('/home', require('./home'));
router.use('/info', require('./info'));
router.use('/language', require('./language'));
router.use('/section', require('./section'));
router.use('/shop', require('./shop'));
router.use('/store', require('./store'));
router.use('/user', require('./user'));
router.use('/erply', authorize([Roles.MANAGER, Roles.ADMINISTRATOR]), require('./erply'));

module.exports = router;

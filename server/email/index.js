const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const dictionaryController = require('../controllers/dictionary');
const sgTransport = require('nodemailer-sendgrid-transport');
const sendGridOptions = { auth: { api_key: process.env.SENDGRID_API_KEY } };
const Templater = require('./templater');

const sendEmail = async (opt) => {
	const mailer = nodemailer.createTransport(sgTransport(sendGridOptions));
	return mailer
		.sendMail({
			...opt,
			from: '"Chinemachine" <hello@chinemachinevintage.com>',
		})
		.then((res) => {
			return res;
		})
		.catch((err) => {
			console.error(err);
			throw new Error('Not able to send e-mail. Please try again.');
		});
};

const send = async (user, subject, template, params, langCode) => {
	const content = await Templater.generate(template, params, langCode);
	const opt = {
		subject: (await translate(subject, langCode)) || 'Unknown subject',
		html: content.html,
		text: content.text,
		to: user.email,
	};
	return sendEmail(opt);
};
const userVerificationEmail = (user, temporaryToken, temporaryCode, langCode) => {
	return send(user, 'verifyAccount', 'verifyAccount', { temporaryToken, temporaryCode }, langCode);
};
const requestPasswordReset = (user, temporaryToken, langCode) => {
	return send(user, 'resetAccountPassword', 'resetPassword', { temporaryToken }, langCode);
};
const passwordResetSuccess = (user, langCode) => {
	return send(user, 'yourAccountHasBeenUpdated', 'resetPasswordSuccess', {}, langCode);
};
const appointmentBooked = async (user, appointment, langCode) => {
	return send(
		user,
		'youBookedAnAppointment',
		'appointmentBooked',
		{ address: formatStoreAddress(appointment), date: formatAppointmentTime(appointment, langCode) },
		langCode
	);
};
const appointmentCancelled = async (user, appointment, langCode) => {
	await appointmentCancelledNotification(user, appointment, langCode);
	return send(
		user,
		'appointmentCancelled',
		'appointmentCancelled',
		{ date: formatAppointmentTime(appointment, langCode) },
		langCode
	);
};
const appointmentCancelledNotification = async (user, appointment, langCode) => {
	const content = await Templater.generate(
		'appointmentCancelledNotification',
		{
			name: user.firstName + ' ' + user.lastName,
			date: formatAppointmentTime(appointment),
			store: appointment.store.name,
			postalCode: appointment.store.postalCode,
		},
		'en'
	);

	return sendEmail({
		to: 'mlduverglas@yahoo.com',
		subject: 'Cancelled appointment: ' + user.firstName + ' ' + user.lastName,
		html: content.html,
		text: content.text,
	});
};
const requestReVerification = async (user, temporaryToken, temporaryCode, langCode) => {
	return send(user, 'verifyAccount', 'requestVerification', { temporaryToken, temporaryCode }, langCode);
};
const formatAppointmentTime = (app, langCode) => {
	const startDate = moment(app.startTime); //,'Europe/Paris')//.locale(langCode);
	const endDate = moment(app.endTime); //,'Europe/Paris')//.locale(langCode);
	return startDate.format('dddd MMMM Do') + ' ' + startDate.format('HH:mm');
};
const formatStoreAddress = (app) => {
	const { store } = app;
	if (!store) return '';
	return store.address + '<br/>' + store.postalCode + ' ' + store.city + '<br/>Tel: ' + store.phone;
};
const translate = async (key, langCode) => {
	const dict = await dictionaryController.getDictionary(langCode);
	return dict[key];
};
module.exports = {
	userVerificationEmail,
	requestPasswordReset,
	requestReVerification,
	passwordResetSuccess,
	appointmentCancelled,
	appointmentBooked,
	send,
};

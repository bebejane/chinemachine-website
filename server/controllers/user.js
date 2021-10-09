const dotnev = require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Roles, verifyRole } = require('../database/roles');
const phone = require('phone');
const parsePhoneNumber = require('libphonenumber-js');
const jwt = require('jsonwebtoken');
const Util = require('../helpers/util');
const User = require('../models/user');
const Email = require('../email');
const Errors = require('../common/errors');

const add = async (user, langCode, opt = {}) => {
	if (!user || typeof user !== 'object') throw Error.create(Errors.INVALID_DATA, langCode);

	let errors;
	user = validateSignup(user, langCode);

	try {
		const existingUser = await User.findOne({ email: user.email });

		if (existingUser) throw Errors.create(Errors.USER_ALREADY_EXISTS, langCode);

		const { temporaryToken, temporaryCode } = await generateTemporaryCodes(user.email);
		let newUser = new User({
			email: user.email,
			password: user.password,
			role: user.role,
			firstName: user.firstName,
			lastName: user.lastName,
			phone: user.phone,
			activated: user.activated ? true : false,
			temporaryToken,
			temporaryCode,
		});

		try {
			if (!opt.noEmail && !user.activated)
				await Email.userVerificationEmail(newUser, newUser.temporaryToken, newUser.temporaryCode, langCode);
		} catch (err) {
			throw Errors.create(Errors.FAILED_SEND_EMAIL, langCode, err);
		}
		try {
			const salt = await bcrypt.genSalt(10);
			const hash = await bcrypt.hash(newUser.password, salt);
			newUser.password = hash;
			await newUser.save();
		} catch (err) {
			throw Errors.create(Errors.FAILED_CREATE_ACCOUNT, langCode, err);
		}

		return get(newUser._id);
	} catch (err) {
		throw err;
	}
};
const get = async (_id) => {
	if (!_id) return null;
	const user = await User.findById(_id).select('_id firstName lastName email phone date activated role').lean();
	return user;
};
const getAll = async () => {
	const users = await User.find({}).lean();
	return users;
};
const update = async (id, user, langCode) => {
	if (!id || !user || typeof user !== 'object') throw Errors.create(Errors.INVALID_DATA, langCode, err);

	const params = {
		firstName: user.firstName,
		lastName: user.lastName,
		phone: user.phone,
		langCode: user.langCode,
	};

	// Set new role if exists
	if (user.role && verifyRole(user.role)) params.role = user.role;

	// Remove undefined params
	Object.keys(params).forEach((k) => {
		if (!params[k]) delete params[k];
	});

	await User.findByIdAndUpdate(id, params, { new: true, runValidators: true }).lean();
	return get(id);
};
const upsert = async (user, langCode) => {
	return !user._id ? await add(user, langCode) : await update(user._id, { ...user }, langCode);
};
const remove = async (userId) => {
	console.log('remove user', userId);
	const user = await User.findById(userId);
	if (!user) throw new Error('User not found');

	await user.remove();
	return user;
};
const removeAll = async () => {
	const users = await User.find({});

	for (var i = 0; i < users.length; i++) await users[i].remove();

	return users;
};
const verify = async (tokenOrCode, langCode) => {
	if (!tokenOrCode) throw Errors.create(Errors.INVALID_SECURITY_CODE, langCode);

	console.log('verify code or token', tokenOrCode, isNaN(tokenOrCode));
	const user = isNaN(tokenOrCode)
		? await User.findOne({ temporaryToken: tokenOrCode }).lean()
		: await User.findOne({ temporaryCode: tokenOrCode }).lean();

	try {
		if (!user) throw Errors.create(Errors.USER_ALREADY_ACTIVE_OR_CODE_EXPIRED, langCode);
		else if (user.activated) throw Errors.create(Errors.USER_ALREADY_ACTIVE, langCode);
		else if (isNaN(tokenOrCode)) {
			try {
				const decoded = await jwt.verify(tokenOrCode, process.env.JWT_PRIVATE_KEY);
			} catch (err) {
				throw Errors.create(Errors.FAILED_VERIFY_ACCOUNT_TOKEN, langCode, err);
			}
		}
		try {
			await User.findByIdAndUpdate(user._id, { activated: true, temporaryToken: null, temporaryCode: null });
		} catch (err) {
			throw Errors.create(Errors.FAILED_ACTIVATE_ACCOUNT, langCode, err);
		}
		console.log('ACTIVATED', user.email);
	} catch (err) {
		throw err;
	}

	return get(user._id);
};
const reverify = async (email, langCode) => {
	const emailError = validateEmail(email, undefined, langCode);
	if (emailError) throw emailError;

	const user = await User.findOne({ email }).lean();
	if (!user) throw Errors.create(Errors.USER_NOT_FOUND, langCode);
	if (user.activated) throw Errors.create(Errors.USER_ALREADY_ACTIVE, langCode);

	const { temporaryToken, temporaryCode } = await generateTemporaryCodes(user.email);
	await User.findByIdAndUpdate(user._id, { temporaryToken, temporaryCode });
	await Email.requestReVerification(user, temporaryToken, temporaryCode, langCode);
	return get(user._id);
};
const requestPasswordReset = async (email, langCode) => {
	const emailError = validateEmail(email, undefined, langCode);
	if (emailError) throw emailError;

	const user = await User.findOne({ email }).lean();
	if (!user) throw Errors.create(Errors.USER_NOT_FOUND, langCode);

	const { temporaryToken } = await generateTemporaryCodes(user.email);
	await User.findByIdAndUpdate(user._id, { temporaryToken });
	await Email.requestPasswordReset(user, temporaryToken, langCode);
	return get(user._id);
};

const updatePassword = async (token, password, password2, langCode) => {
	const passwordError = validatePassword(password, password2, langCode);

	if (passwordError) throw new Error(passwordError);

	let user = await User.findOne({ temporaryToken: token }).lean();

	if (!user) throw Errors.create(Errors.USER_NOT_FOUND, langCode);
	if (!user.activated) throw Errors.create(Errors.USER_ALREADY_ACTIVE, langCode);

	const salt = await bcrypt.genSalt(10);
	const newPassword = await bcrypt.hash(password, salt);
	user = await User.findByIdAndUpdate(user._id, {
		password: newPassword,
		temporaryToken: null,
		temporaryCode: null,
	}).lean();
	await Email.passwordResetSuccess(user, langCode);
	return get(user._id);
};
const validateSignup = (params, langCode) => {
	if (!params || typeof params !== 'object') return ['Invalid signup, no params'];

	// Trim all params
	console.log(params);
	Object.keys(params).forEach((k) => (params[k] && params[k].trim ? (params[k] = params[k].trim()) : null));
	//console.log('verify signup', params)
	let errors = [];

	const emailError = validateEmail(params.email, params.email2, langCode);
	const passwordError = validatePassword(params.password, params.password2, langCode);

	if (emailError) errors.push(emailError);
	if (passwordError) errors.push(passwordError);

	if (!params.firstName) errors.push(Errors.translate(Errors.INVALID_FIRST_NAME, langCode));

	if (!params.lastName) errors.push(Errors.translate(Errors.INVALID_LAST_NAME, langCode));

	if (!params.phone || !parsePhoneNumber(params.phone)) errors.push(Errors.translate(Errors.INVALID_PHONE, langCode));
	else if (params.phone) params.phone = parsePhoneNumber(params.phone).number;

	if (errors.length) throw new Error(errors.join(', '));

	return params;
};
const validatePassword = (password, password2, langCode) => {
	if (!password) return Errors.translate(Errors.INVALID_PASSWORD, langCode);
	else if (password2 !== undefined && password !== password2)
		return Errors.translate(Errors.PASSWORD_DOES_NOT_MATCH, langCode);
	else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password))
		return Errors.translate(Errors.INVALID_PASSWORD_FORMAT, langCode);
	else return null;
};
const validateEmail = (email, email2, langCode) => {
	if (!email) return Errors.translate(Errors.INVALID_EMAIL, langCode);
	else if (email && email2 && email2 !== undefined && email !== email2)
		return Errors.translate(Errors.EMAIL_DOES_NOT_MATCH, langCode);
	else if (!/\S+@\S+\.\S+/.test(email)) return Errors.translate(Errors.INVALID_EMAIL_FORMAT, langCode);
	else return null;
};
const generateTemporaryCodes = async (email, langCode) => {
	if (!email) throw Errors.create(Errors.INVALID_EMAIL, langCode);
	const temporaryToken = await jwt.sign({ email }, process.env.JWT_PRIVATE_KEY, { expiresIn: 12000 });
	const temporaryCode = Util.generateSMSCode();
	return {
		temporaryCode,
		temporaryToken,
	};
};

const search = async (term) => {
	if (!term) return [];
	var reg = new RegExp(term, 'gi');
	const users = await User.find({
		$or: [{ firstName: reg }, { lastName: reg }, { email: reg }],
	})
		.where('role')
		.ne('ROOT')
		.select('_id firstName lastName email phone date activated role')
		.lean();
	return users;
};
module.exports = {
	get,
	getAll,
	add,
	update,
	upsert,
	remove,
	removeAll,
	verify,
	reverify,
	requestPasswordReset,
	updatePassword,
	search,
};
